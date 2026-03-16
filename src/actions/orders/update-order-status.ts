"use server"

import { PostgrestError } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

import type { OrderStatus } from "@/lib/definitions/orders"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"  
import type { ActionResponse } from "@/types/action-response"
import { handleOrderStatusChange } from "@/lib/events/order-events"
import { getPfRates, getPjRates } from '@/actions/rates'
import { calculateInstallmentPayment } from '@/lib/utils'

interface UpdateOrderStatusParams {
	orderId: string
	status: OrderStatus
}

interface OrderDataForWebhook {
	id: string
	kdi: number
	system_power: number
	current_consumption: number
	connection_voltage: string
	equipment_value: number
	labor_value: number
	other_costs: number
	created_at: string
	updated_at: string
	status: OrderStatus
	payment_day: number | null
	financing_term: number | null
	monthly_bill_value: number
	notes: string | null
	customers: {
		type: 'pf' | 'pj'
		document: string
		name: string
		cpf?: string
		cnpj?: string
		individual_name?: string
		company_name?: string
		marital_status?: string | null
		birth_date?: string | null
		gender?: string | null
		occupation?: string | null
		contact_name: string
		contact_email: string
		contact_phone: string
		address: {
			postal_code: string
			street: string
			number: string
			complement: string | null
			neighborhood: string
			city: string
			state: string
		}
		partner?: {
			contact_name: string
			legal_business_name: string
		} | null
	}
	sellers: {
		name: string
	} | null
	simulation?: {
		investment_value: number
		management_fee_percent: number
		management_fee_value: number
		service_fee_percent: number
		service_fee_value: number
		total_investment: number
		installments: Array<{
			term_months: number
			interest_rate_percent: number
			monthly_installment: number
		}>
	}
}
 
async function sendOrderWebhook(apiKeyId: string, orderId: string, eventType: string, orderData: OrderDataForWebhook) {
	try {
		const supabase = createAdminClient()
		
		const { data: apiKeyData } = await (supabase
			.from('api_keys') as any)
			.select('webhook_url, name')
			.eq('id', apiKeyId)
			.single()

		if (!apiKeyData?.webhook_url) {
			console.log(`API Key ${apiKeyId} não tem webhook configurado`)
			return
		}

		const webhookPayload = {
			event: eventType,
			timestamp: new Date().toISOString(),
			data: orderData
		}

		const response = await fetch(apiKeyData.webhook_url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'User-Agent': 'MEO-ERP-API/1.0',
			},
			body: JSON.stringify(webhookPayload),
			signal: AbortSignal.timeout(10000)
		})

		const responseText = await response.text().catch(() => '')

		if (!response.ok) {
			console.error(`Webhook falhou: ${response.status} ${response.statusText}`)

			await (supabase as any).from('api_key_webhook_logs').insert({
				api_key_id: apiKeyId,
				url: apiKeyData.webhook_url,
				event_type: eventType,
				status_code: response.status,
				success: false,
				error_message: responseText || 'Unknown error',
				response_body: responseText || null,
				payload: JSON.parse(JSON.stringify(webhookPayload))
			})
		} else {
			console.log(`Webhook enviado com sucesso para ${apiKeyData.webhook_url}`)

			await (supabase as any).from('api_key_webhook_logs').insert({
				api_key_id: apiKeyId,
				url: apiKeyData.webhook_url,
				event_type: eventType,
				status_code: response.status,
				success: true,
				response_body: responseText || null,
				payload: JSON.parse(JSON.stringify(webhookPayload))
			})
		}
	} catch (error) {
		console.error('Erro ao enviar webhook:', error)
		
		const supabase = createAdminClient()
		await (supabase as any).from('api_key_webhook_logs').insert({
			api_key_id: apiKeyId,
			url: 'unknown',
			event_type: eventType,
			status_code: 0,
			success: false,
			error_message: error instanceof Error ? error.message : 'Unknown error',
			payload: null
		})
	}
}

async function updateOrderStatus({ orderId, status }: UpdateOrderStatusParams): Promise<ActionResponse<{ orderId: string }>> {
	if (!orderId) {
		return { success: false, message: "ID do pedido não fornecido." }
	}
	if (!status) {
		return { success: false, message: "Novo status não fornecido." }
	}

	const supabase = await createClient()

	try {
		// 1. Buscar pedido atual (antes da atualização) para ver se tem API Key
		const { data: currentOrder } = await (supabase
			.from("orders") as any)
			.select(`id, status, api_key_id`)
			.eq("id", orderId)
			.single()

		console.log("🔍 Pedido atual:", currentOrder)

		if (!currentOrder) {
			return { success: false, message: "Pedido não encontrado." }
		}

		const hasApiKey = !!currentOrder.api_key_id
		const oldStatus = currentOrder.status

		// 2. Atualizar status
		const { error, count } = await supabase
			.from("orders")
			.update({ status } as any, { count: "exact" })
			.eq("id", orderId)

		if (error) {
			console.error("Erro ao atualizar status do pedido (Supabase):", error)
			if (error instanceof PostgrestError) {
				return { success: false, message: `Erro no banco de dados: ${error.message}` }
			}
			return { success: false, message: "Ocorreu um erro ao tentar atualizar o status." }
		}

		if (count === 0) {
			return { success: false, message: "Nenhum pedido encontrado com o ID fornecido." }
		}

		// 3. Buscar dados COMPLETOS do pedido atualizado para webhook
		let orderDataForWebhook: OrderDataForWebhook | null = null
		if (hasApiKey && currentOrder.api_key_id) {
			const supabaseAdmin = createAdminClient()
			
			// Buscar taxas PF e PJ de uma vez
			const [pfRatesResponse, pjRatesResponse] = await Promise.all([getPfRates(), getPjRates()])
			const pfRates = pfRatesResponse.success ? pfRatesResponse.data : null
			const pjRates = pjRatesResponse.success ? pjRatesResponse.data : null
						
			const { data: fullOrderData, error: fetchError } = await (supabaseAdmin
				.from("orders") as any)
				.select(`
					id,
					kdi,
					system_power,
					current_consumption,
					connection_voltage,
					equipment_value,
					labor_value,
					other_costs,
					created_at,
					updated_at,
					status,
					payment_day,
					financing_term,
					monthly_bill_value,
					notes,
					api_key_id,
					customers!inner (
						id, 
						type,
						cpf, 
						cnpj, 
						name,
						company_name, 
						contact_name,
						contact_email,
						contact_phone,
						city, 
						state, 
						postal_code, 
						street, 
						number, 
						neighborhood,
						complement,
						marital_status,        
						birth_date,          
						gender,              
						occupation,          
						partners ( 
							id,
							contact_name, 
							legal_business_name 
						)
					),
					sellers:seller_id ( 
						id,
						name 
					)
				`)
				.eq("id", orderId)
				.single()

			console.log("📦 Resultado da busca completa:", { 
				found: !!fullOrderData, 
				error: fetchError?.message,
				hasCustomer: !!fullOrderData?.customers
			})

			if (fullOrderData && fullOrderData.customers) {
				
				const document = fullOrderData.customers.type === 'pf' 
					? (fullOrderData.customers.cpf || '') 
					: (fullOrderData.customers.cnpj || '')
				
				const customerName = fullOrderData.customers.type === 'pf'
					? (fullOrderData.customers.name || '')
					: (fullOrderData.customers.company_name || '')

				const formattedBirthDate = fullOrderData.customers?.birth_date 
					? new Date(fullOrderData.customers.birth_date).toISOString().split('T')[0]
					: null

				orderDataForWebhook = {
					id: fullOrderData.id,
					kdi: fullOrderData.kdi,
					system_power: fullOrderData.system_power,
					current_consumption: fullOrderData.current_consumption,
					connection_voltage: fullOrderData.connection_voltage || "000",
					equipment_value: fullOrderData.equipment_value || 0,
					labor_value: fullOrderData.labor_value || 0,
					other_costs: fullOrderData.other_costs || 0,
					created_at: fullOrderData.created_at,
					updated_at: fullOrderData.updated_at,
					status: fullOrderData.status as OrderStatus,
					payment_day: fullOrderData.payment_day || null,
					financing_term: fullOrderData.financing_term || null,
					monthly_bill_value: fullOrderData.monthly_bill_value || 0,
					notes: fullOrderData.notes || '',
					customers: {
						type: fullOrderData.customers.type as 'pf' | 'pj',
						document: document,
						name: customerName,
						...(fullOrderData.customers.type === 'pf' ? {
							cpf: fullOrderData.customers.cpf || '',
							individual_name: fullOrderData.customers.name || '',
							marital_status: fullOrderData.customers.marital_status || null,
							birth_date: formattedBirthDate,
							gender: fullOrderData.customers.gender || null,
							occupation: fullOrderData.customers.occupation || null
						} : {
							cnpj: fullOrderData.customers.cnpj || '',
							company_name: fullOrderData.customers.company_name || ''
						}),
						contact_name: fullOrderData.customers.contact_name || '',
						contact_email: fullOrderData.customers.contact_email || '',
						contact_phone: fullOrderData.customers.contact_phone || '',
						address: {
							postal_code: fullOrderData.customers.postal_code || '',
							street: fullOrderData.customers.street || '',
							number: fullOrderData.customers.number || '',
							complement: fullOrderData.customers.complement || '',
							neighborhood: fullOrderData.customers.neighborhood || '',
							city: fullOrderData.customers.city || '',
							state: fullOrderData.customers.state || ''
						},
						...(fullOrderData.customers.partners ? {
							partner: {
								contact_name: fullOrderData.customers.partners.contact_name || '',
								legal_business_name: fullOrderData.customers.partners.legal_business_name || ''
							}
						} : { partner: null })
					},
					sellers: fullOrderData.sellers ? {
						name: fullOrderData.sellers.name || ''
					} : null
				} as OrderDataForWebhook

				// Calcular simulação para PF e PJ
				const isPj = fullOrderData.customers?.type === 'pj'
				const rates = isPj ? pjRates : pfRates

				if (rates) {
					const equipmentValue = fullOrderData.equipment_value || 0
					const laborValue = fullOrderData.labor_value || 0
					const otherCosts = fullOrderData.other_costs || 0
					const investmentValue = equipmentValue + laborValue + otherCosts

					const managementFeePercent = isPj ? (rates.pj_management_fee || 4) : (rates.pf_management_fee || 8)
					const managementFeeValue = investmentValue * (managementFeePercent / 100)
					const serviceFeePercent = isPj ? (rates.pj_service_fee || 8) : (rates.pf_service_fee || 8)
					const serviceFeeValue = (investmentValue + managementFeeValue) * (serviceFeePercent / 100)
					const totalInvestment = investmentValue + managementFeeValue + serviceFeeValue

					const months = isPj ? [24, 36, 48, 60] : [24, 30, 36, 48, 60, 72, 84, 96]
					const monthlyRates: Record<number, number> = isPj
						? {
							24: rates.pj_interest_rate_24 || 2.5,
							36: rates.pj_interest_rate_36 || 2.5,
							48: rates.pj_interest_rate_48 || 2.5,
							60: rates.pj_interest_rate_60 || 2.5,
						}
						: {
							24: rates.pf_interest_rate_24 || 1.49,
							30: rates.pf_interest_rate_30 || 1.49,
							36: rates.pf_interest_rate_36 || 1.60,
							48: rates.pf_interest_rate_48 || 1.64,
							60: rates.pf_interest_rate_60 || 1.68,
							72: rates.pf_interest_rate_72 || 1.72,
							84: rates.pf_interest_rate_84 || 1.76,
							96: rates.pf_interest_rate_96 || 1.80,
						}

					const defaultRate = isPj ? 2.5 : 1.5
					const installments = months.map(month => {
						const rate = (monthlyRates[month] || defaultRate) / 100
						const installment = calculateInstallmentPayment({
							numberOfPeriods: month,
							presentValue: totalInvestment,
							rate
						})
						return {
							term_months: month,
							interest_rate_percent: monthlyRates[month] || defaultRate,
							monthly_installment: Number(installment.toFixed(2))
						}
					})

					orderDataForWebhook.simulation = {
						investment_value: Number(investmentValue.toFixed(2)),
						management_fee_percent: managementFeePercent,
						management_fee_value: Number(managementFeeValue.toFixed(2)),
						service_fee_percent: serviceFeePercent,
						service_fee_value: Number(serviceFeeValue.toFixed(2)),
						total_investment: Number(totalInvestment.toFixed(2)),
						installments
					}
				}

				if (orderDataForWebhook.customers && !orderDataForWebhook.customers.partner) {
					delete orderDataForWebhook.customers.partner
				}

				console.log("✅ Dados formatados para webhook:", orderDataForWebhook)
 
			} else {
				console.error("❌ Não foi possível buscar dados completos do pedido")
			}
		}

		// 4. Enviar webhook se houver API Key (fire and forget)
		if (hasApiKey && currentOrder.api_key_id && orderDataForWebhook) {
			console.log("🚀 Enviando webhook para:", currentOrder.api_key_id)
			console.log("📤 Evento:", `order.status.${status}`)
			
			sendOrderWebhook(
				currentOrder.api_key_id,
				orderId,
				`order.status.${status}`,
				orderDataForWebhook
			).catch(err => console.error('Erro no webhook:', err))
		} else {
			console.log("⏭️  Webhook não enviado:", {
				hasApiKey,
				apiKeyId: currentOrder.api_key_id,
				hasData: !!orderDataForWebhook
			})
		}

		// 5. Revalidar cache
		revalidatePath("/dashboard/orders")

		// 6. Obter usuário atual para o log
		const { data: { user } } = await supabase.auth.getUser()
		const authorId = user?.id

		// 7. Disparar notificação interna (fire and forget)
		handleOrderStatusChange(orderId, status, authorId).catch(err => console.error("Erro ao enviar notificação:", err))

		return {
			success: true,
			message: "Status do pedido atualizado com sucesso!",
			data: { orderId }
		}
	} catch (e) {
		console.error("Erro inesperado em updateOrderStatus:", e)
		return { success: false, message: "Ocorreu um erro inesperado no servidor." }
	}
}

export default updateOrderStatus