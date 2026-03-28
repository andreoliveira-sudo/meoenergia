"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { quickOrderPJSchema, type QuickOrderPJSchema } from "@/lib/validations/fast-track-order"
import type { ActionResponse } from "@/types/action-response"
import getCurrentUser from "@/actions/auth/get-current-user"

export default async function createQuickOrderPJ(data: QuickOrderPJSchema): Promise<ActionResponse<{ orderId: string; customerId: string }>> {
	const result = quickOrderPJSchema.safeParse(data)

	if (!result.success) {
		return { success: false, message: "Dados inválidos", errors: result.error.flatten().fieldErrors }
	}

	const {
		cnpj, company_name, trading_name, contact_name, email, phone,
		postal_code, street, neighborhood, city, state, number,
		current_consumption, monthly_bill_value, system_power,
		equipment_value, labor_value, payment_day, financing_term
	} = result.data

	const supabase = await createClient()
	const user = await getCurrentUser()

	if (!user || !user.id) {
		return { success: false, message: "Usuário não autenticado" }
	}

	let internalManagerId: string | null = null
	let partnerId: string | null = null

	if (user.role === 'seller') {
		const { data: seller } = await supabase.from('sellers').select('id').eq('user_id', user.id).single()
		internalManagerId = seller?.id || null
	} else if (user.role === 'partner') {
		const { data: partner } = await supabase.from('partners').select('id').eq('user_id', user.id).single()
		partnerId = partner?.id || null
	}

	try {
		const cleanCnpj = cnpj.replace(/\D/g, "")
		let customerId: string | null = null

		const { data: existingCustomer } = await supabase
			.from("customers")
			.select("id, internal_manager, partner_id")
			.eq("cnpj", cleanCnpj)
			.maybeSingle()

		if (existingCustomer) {
			customerId = existingCustomer.id

			if (user.role === 'seller' && !existingCustomer.internal_manager && internalManagerId) {
				await supabase
					.from("customers")
					.update({ internal_manager: internalManagerId })
					.eq("id", customerId)
			}
			if (user.role === 'partner' && !existingCustomer.partner_id && partnerId) {
				await supabase
					.from("customers")
					.update({ partner_id: partnerId })
					.eq("id", customerId)
			}
		} else {
			const { data: newCustomer, error: createCustomerError } = await supabase
				.from("customers")
				.insert({
					type: 'pj',
					company_name: company_name,
					cnpj: cleanCnpj,
					name: null,
					cpf: null,
					contact_name: contact_name,
					contact_phone: phone.replace(/\D/g, ""),
					contact_email: email,
					postal_code: postal_code.replace(/\D/g, ""),
					street,
					number,
					neighborhood,
					city,
					state,
					complement: null,
					created_by_user_id: user.id,
					internal_manager: internalManagerId,
					partner_id: partnerId,
					annual_revenue: null,
				})
				.select("id")
				.single()

			if (createCustomerError) {
				console.error("Erro ao criar cliente PJ:", createCustomerError)
				return { success: false, message: "Erro ao criar cliente. Verifique se o CNPJ já existe." }
			}
			customerId = newCustomer.id
		}

		const { data: newOrder, error: createOrderError } = await supabase
			.from("orders")
			.insert({
				customer_id: customerId!,
				created_by_user_id: user.id,
				status: 'analysis_pending',
				order_status: 'in_review' as any,
				current_consumption,
				monthly_bill_value,
				financing_term,
				payment_day,
				system_power,
				equipment_value,
				labor_value,
				other_costs: 0,
				interest_rate_36: 2.3,
				interest_rate_48: 1.95,
				interest_rate_60: 1.9,
				service_fee_36: 4,
				service_fee_48: 5,
				service_fee_60: 6.3,
				energy_provider: '',
				connection_voltage: '000',
				structure_type: '9f95b191-2781-4ab3-a1e5-149d5d5257c9',
				kit_module_id: 5,
				kit_inverter_id: 6,
				kit_others: null,
				notes: null,
				seller_id: internalManagerId,
			})
			.select("id")
			.single()

		if (createOrderError) {
			console.error("Erro ao criar pedido:", createOrderError)
			return { success: false, message: "Erro ao criar pedido." }
		}

		const { error: historyError } = await supabase
			.from("order_history")
			.insert({
				order_id: newOrder.id,
				new_status: 'analysis_pending',
				changed_by: user.id,
				reason: 'Pedido criado via Fast Track (Novo Pedido PJ)'
			})

		if (historyError) {
			console.error("Erro ao registrar histórico:", historyError)
		}

		revalidatePath("/dashboard/orders")
		return {
			success: true,
			message: "Pedido criado com sucesso!",
			data: {
				orderId: newOrder.id,
				customerId: customerId!
			}
		}

	} catch (error) {
		console.error("Erro interno:", error)
		return { success: false, message: "Erro interno no servidor" }
	}
}
