"use server"

import type { EditSimulationData } from "@/components/forms/new-simulation/validation/new-simulation"
import { documentFields } from "@/lib/constants"
import { createAdminClient } from "@/lib/supabase/admin"
import type { ActionResponse } from "@/types/action-response"
import { revalidatePath } from "next/cache"
import { checkOrderDocumentsStatus, uploadOrderFiles } from "."
import { getPfRates, getPjRates } from '@/actions/rates'
import { calculateInstallmentPayment } from '@/lib/utils'
import type { OrderStatus } from "@/lib/definitions/orders"

// Interface EXATAMENTE igual à do updateOrderStatus
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

const parseCurrencyStringToNumber = (value: string | undefined | null): number => {
	if (!value) return 0
	const sanitizedValue = value.replace(/\./g, "").replace(",", ".")
	const numberValue = parseFloat(sanitizedValue)
	return Number.isNaN(numberValue) ? 0 : numberValue
}

// Função para PF e PJ - mesmo formato do updateOrderStatus
async function sendOrderUpdatedWebhook(apiKeyId: string, orderId: string) {
	try {
		const supabaseAdmin = createAdminClient()

		// Buscar webhook_url da API Key
		const { data: apiKeyData } = await supabaseAdmin
			.from('api_keys')
			.select('webhook_url, name')
			.eq('id', apiKeyId)
			.single()

		if (!apiKeyData?.webhook_url) {
			console.log(`API Key ${apiKeyId} não tem webhook configurado`)
			return
		}

		// Buscar taxas PF e PJ de uma vez
		const [pfRatesResponse, pjRatesResponse] = await Promise.all([getPfRates(), getPjRates()])
		const pfRates = pfRatesResponse.success ? pfRatesResponse.data : null
		const pjRates = pjRatesResponse.success ? pjRatesResponse.data : null

		// Buscar dados COMPLETOS do pedido - EXATAMENTE como no updateOrderStatus
		const { data: fullOrderData } = await supabaseAdmin
			.from("orders")
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

		if (!fullOrderData || !fullOrderData.customers) {
			console.log(`Pedido ${orderId} não encontrado ou sem cliente`)
			return
		}

		const isPj = fullOrderData.customers.type === 'pj'
		const rates = isPj ? pjRates : pfRates

		// Formatar data de nascimento
		const formattedBirthDate = fullOrderData.customers?.birth_date
			? new Date(fullOrderData.customers.birth_date).toISOString().split('T')[0]
			: null

		// ✅ MESMO FORMATO EXATO do updateOrderStatus
		const orderDataForWebhook: OrderDataForWebhook = {
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
				document: isPj
					? (fullOrderData.customers.cnpj || '')
					: (fullOrderData.customers.cpf || ''),
				name: isPj
					? (fullOrderData.customers.company_name || '')
					: (fullOrderData.customers.name || ''),
				...(isPj
					? {
						cnpj: fullOrderData.customers.cnpj || '',
						company_name: fullOrderData.customers.company_name || ''
					}
					: {
						cpf: fullOrderData.customers.cpf || '',
						individual_name: fullOrderData.customers.name || '',
						marital_status: fullOrderData.customers.marital_status || null,
						birth_date: formattedBirthDate,
						gender: fullOrderData.customers.gender || null,
						occupation: fullOrderData.customers.occupation || null
					}
				),
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
				partner: fullOrderData.customers.partners ? {
					contact_name: fullOrderData.customers.partners.contact_name || '',
					legal_business_name: fullOrderData.customers.partners.legal_business_name || ''
				} : null
			},
			sellers: fullOrderData.sellers ? {
				name: fullOrderData.sellers.name || ''
			} : null
		}

		// ✅ Calcular simulação para PF e PJ (igual ao updateOrderStatus)
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

		// ✅ Remover partner se for null
		if (orderDataForWebhook.customers && !orderDataForWebhook.customers.partner) {
			delete orderDataForWebhook.customers.partner
		}

		// ✅ Payload IDÊNTICO ao updateOrderStatus
		const webhookPayload = {
			event: "order.updated",
			timestamp: new Date().toISOString(),
			data: orderDataForWebhook
		}

		// Enviar webhook
		const response = await fetch(apiKeyData.webhook_url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'User-Agent': 'MEO-ERP-API/1.0',
			},
			body: JSON.stringify(webhookPayload),
			signal: AbortSignal.timeout(10000)
		})

		// Log do resultado
		await supabaseAdmin.from('api_key_webhook_logs').insert({
			api_key_id: apiKeyId,
			url: apiKeyData.webhook_url,
			event_type: 'order.updated',
			status_code: response.status,
			success: response.ok,
			error_message: response.ok ? null : await response.text().catch(() => 'Unknown error'),
			payload: JSON.parse(JSON.stringify(webhookPayload))
		})

		console.log(`Webhook de atualização ${response.ok ? 'enviado' : 'falhou'} para ${apiKeyData.webhook_url}`)

	} catch (error) {
		console.error('Erro ao enviar webhook de atualização:', error)

		const supabaseAdmin = createAdminClient()
		await supabaseAdmin.from('api_key_webhook_logs').insert({
			api_key_id: apiKeyId,
			url: 'unknown',
			event_type: 'order.updated',
			status_code: 0,
			success: false,
			error_message: error instanceof Error ? error.message : 'Unknown error',
			payload: null
		})
	}
}

interface UpdateOrderParams {
	orderId: string
	customerId: string
	data: EditSimulationData
}

async function updateOrder({ orderId, customerId, data }: UpdateOrderParams): Promise<ActionResponse<null>> {
	const supabaseAdmin = createAdminClient()

	try {
		// 1. Buscar dados ATUAIS do cliente para UPDATE
		const { data: currentCustomer, error: customerFetchError } = await supabaseAdmin
			.from("customers")
			.select("*")
			.eq("id", customerId)
			.single()

		if (customerFetchError || !currentCustomer) {
			console.error("Erro ao buscar cliente:", customerFetchError)
			return { success: false, message: "Cliente não encontrado." }
		}

		// 2. Buscar dados ATUAIS do pedido para UPDATE
		const { data: currentOrder, error: orderFetchError } = await supabaseAdmin
			.from("orders")
			.select(`
				id,
				api_key_id,
				status,
				monthly_bill_value,
				customer_id,
				created_by_user_id,
				interest_rate_36,
				interest_rate_48,
				interest_rate_60,
				service_fee_36,
				service_fee_48,
				service_fee_60,
				energy_provider,
				connection_voltage,
				structure_type,
				kit_module_id,
				kit_inverter_id,
				equipment_value,
				labor_value,
				other_costs,
				financing_term,
				payment_day,
				customers!inner (
					type
				)
			`)
			.eq("id", orderId)
			.single()

		if (orderFetchError || !currentOrder) {
			console.error("Erro ao buscar pedido:", orderFetchError)
			return { success: false, message: "Pedido não encontrado." }
		}

		const hasApiKey = !!currentOrder.api_key_id
		const apiKeyId = currentOrder.api_key_id

		// 3. Atualizar cliente com TODOS os campos obrigatórios
		const customerData = {
			// Campos PF obrigatórios - manter valores atuais
			name: currentCustomer.name,
			cpf: currentCustomer.cpf,
			marital_status: currentCustomer.marital_status,
			birth_date: currentCustomer.birth_date,
			gender: currentCustomer.gender,
			occupation: currentCustomer.occupation,
			// Campos PJ obrigatórios - manter valores atuais
			company_name: currentCustomer.company_name || '',
			cnpj: currentCustomer.cnpj || '',
			// Campos comuns obrigatórios
			contact_name: data.contactName,
			contact_phone: data.contactPhone.replace(/\D/g, ""),
			contact_email: data.contactEmail,
			postal_code: data.cep.replace(/\D/g, ""),
			street: data.street,
			number: data.number,
			neighborhood: data.neighborhood,
			city: data.city,
			state: data.state,
			// Campos opcionais
			complement: data.complement ?? null,
			incorporation_date: currentCustomer.incorporation_date,
			trading_name: currentCustomer.trading_name,
			state_registration: currentCustomer.state_registration,
			annual_revenue: currentCustomer.annual_revenue,
			// Metadados
			updated_at: new Date().toISOString()
		}

		const { error: customerError } = await supabaseAdmin
			.from("customers")
			.update(customerData)
			.eq("id", customerId)

		if (customerError) {
			console.error("Erro ao atualizar cliente:", customerError)
			throw new Error(`Erro ao atualizar cliente: ${customerError.message}`)
		}

		// 4. Atualizar pedido com TODOS os campos obrigatórios
		const orderData = {
			// Campos obrigatórios - manter valores atuais
			id: currentOrder.id,
			api_key_id: currentOrder.api_key_id,
			customer_id: currentOrder.customer_id,
			created_by_user_id: currentOrder.created_by_user_id,
			status: currentOrder.status,
			monthly_bill_value: data.monthlyBillValue || currentOrder.monthly_bill_value,
			interest_rate_36: currentOrder.interest_rate_36,
			interest_rate_48: currentOrder.interest_rate_48,
			interest_rate_60: currentOrder.interest_rate_60,
			service_fee_36: currentOrder.service_fee_36,
			service_fee_48: currentOrder.service_fee_48,
			service_fee_60: currentOrder.service_fee_60,

			// Campos que estamos atualizando
			system_power: parseCurrencyStringToNumber(data.systemPower),
			current_consumption: parseCurrencyStringToNumber(data.currentConsumption),
			energy_provider: data.energyProvider || currentOrder.energy_provider,
			structure_type: data.structureType || currentOrder.structure_type,
			connection_voltage: data.connectionVoltage || currentOrder.connection_voltage,
			kit_module_id: data.kit_module ? Number(data.kit_module) : currentOrder.kit_module_id,
			kit_inverter_id: data.kit_inverter ? Number(data.kit_inverter) : currentOrder.kit_inverter_id,
			equipment_value: data.equipmentValue ?? currentOrder.equipment_value,
			labor_value: data.laborValue ?? currentOrder.labor_value,
			other_costs: data.otherCosts ?? currentOrder.other_costs,
			financing_term: typeof data.financingTerm === 'number' ? data.financingTerm : currentOrder.financing_term,
			payment_day: typeof data.paymentDay === 'number' ? data.paymentDay : currentOrder.payment_day,
			updated_at: new Date().toISOString()
		}

		const { error: orderError } = await supabaseAdmin
			.from("orders")
			.update(orderData)
			.eq("id", orderId)

		if (orderError) {
			console.error("Erro ao atualizar pedido:", orderError)
			throw new Error(`Erro ao atualizar pedido: ${orderError.message}`)
		}

		// 5. Build FormData e fazer upload de novos arquivos
		const uploadFormData = new FormData()
		let hasNewFiles = false

		for (const field of documentFields) {
			const fileList = data[field.name as keyof EditSimulationData]
			if (fileList && Array.isArray(fileList) && fileList.length > 0 && fileList[0] instanceof File) {
				uploadFormData.append(field.name, fileList[0])
				hasNewFiles = true
			}
		}

		// 6. Enviar webhook se tiver API Key (PF e PJ)
		if (hasApiKey && apiKeyId) {
			console.log("🚀 Enviando webhook para atualização de pedido")
			sendOrderUpdatedWebhook(apiKeyId, orderId).catch(err =>
				console.error('Erro no webhook de atualização:', err)
			)
		} else {
			console.log("⏭️  Webhook não enviado: sem API Key")
		}

		// 7. Processar upload de arquivos
		if (hasNewFiles) {
			const uploadResponse = await uploadOrderFiles(orderId, uploadFormData)
			if (!uploadResponse.success) {
				console.warn("Pedido atualizado, mas houve um erro no upload de novos arquivos:", uploadResponse.message)
			} else if (uploadResponse.data.uploadedCount > 0) {
				await checkOrderDocumentsStatus(orderId)

				// Webhook adicional para documentos
				if (hasApiKey && apiKeyId) {
					console.log("📎 Enviando webhook adicional para upload de documentos")
					sendOrderUpdatedWebhook(apiKeyId, orderId).catch(err =>
						console.error('Erro no webhook de documentos:', err)
					)
				}
			}
		}

		revalidatePath("/dashboard/orders")

		return {
			success: true,
			message: "Pedido atualizado com sucesso!",
			data: null
		}

	} catch (error) {
		console.error("❌ Erro inesperado em updateOrder:", error)
		return {
			success: false,
			message: error instanceof Error ? error.message : "Ocorreu um erro inesperado ao salvar as alterações."
		}
	}
}

export default updateOrder
