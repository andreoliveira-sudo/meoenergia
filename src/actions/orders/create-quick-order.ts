"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { quickOrderPFSchema, type QuickOrderPFSchema } from "@/lib/validations/fast-track-order"
import type { ActionResponse } from "@/types/action-response"
import getCurrentUser from "@/actions/auth/get-current-user"

export default async function createQuickOrderPF(data: QuickOrderPFSchema): Promise<ActionResponse<{ orderId: string }>> {
	const result = quickOrderPFSchema.safeParse(data)

	if (!result.success) {
		return { success: false, message: "Dados inválidos", errors: result.error.flatten().fieldErrors }
	}

	const {
		cpf, name, email, phone, postal_code, street, neighborhood, city, state, number,
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
		const cleanCpf = cpf.replace(/\D/g, "")
		let customerId: string | null = null

		const { data: existingCustomer } = await supabase
			.from("customers")
			.select("id, internal_manager, partner_id")
			.or(`cpf.eq.${cleanCpf},cpf.eq.${cpf}`)
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
			const cleanPhone = phone.replace(/\D/g, "")
			const cleanPostalCode = postal_code.replace(/\D/g, "")

			const { data: newCustomer, error: createCustomerError } = await supabase
				.from("customers")
				.insert({
					type: 'pf',
					name: name,
					cpf: cleanCpf,
					company_name: '',
					cnpj: '',
					contact_name: name,
					contact_phone: cleanPhone,
					contact_email: email,
					postal_code: cleanPostalCode,
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
				console.error("Erro ao criar cliente:", createCustomerError)
				return { success: false, message: "Erro ao criar cliente. Verifique se o CPF já existe." }
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
				reason: 'Pedido criado via Fast Track (Novo Pedido PF)'
			})

		if (historyError) {
			console.error("Erro ao criar histórico:", historyError)
		}

		revalidatePath("/dashboard/orders")
		return { success: true, message: "Pedido criado com sucesso!", data: { orderId: newOrder.id } }

	} catch (error) {
		console.error("Erro interno:", error)
		return { success: false, message: "Erro interno no servidor" }
	}
}
