"use server"

import type { OrderWithRelations } from "@/lib/definitions/orders"
import { createClient } from "@/lib/supabase/server"

async function getAllOrders(): Promise<OrderWithRelations[]> {
	try {
		const supabase = await createClient()

		const { data: { user }, error: authError } = await supabase.auth.getUser()

		if (authError || !user) {
			console.error("Usuário não autenticado")
			return []
		}

		// Buscar role do usuário
		const { data: roleData } = await supabase
			.from('users')
			.select('role')
			.eq('id', user.id)
			.single()

		const isAdmin = roleData?.role === 'admin'

		let query = supabase
			.from("orders")
			.select(
				`
        id,
        kdi,
        system_power,
        equipment_value,
        labor_value,
        other_costs,
        created_at,
        status,
				notes,
				customers (
					id,
					name,
					cnpj,
					company_name,
					type,
					city,
					state,
					partners ( contact_name, legal_business_name )
				),
				sellers (
					name
				),
				service_fee_60,
				created_by:created_by_user_id ( name )
			`
			)
			.order("created_at", { ascending: false })

		if (!isAdmin) {
			query = query.eq('created_by_user_id', user.id)
		}

		const { data, error } = await query

		if (error) {
			console.error("Erro ao buscar pedidos com detalhes:", error)
			return []
		}

		// Mapeia os dados para a estrutura final, incluindo o cálculo do valor total
		const mappedData = data.map((order) => {
			const customerData = order.customers
			const customer = Array.isArray(customerData) ? customerData[0] : customerData

			if (!customer) {
				return null
			}

			const subtotal = (order.equipment_value || 0) + (order.labor_value || 0) + (order.other_costs || 0)
			const fee = order.service_fee_60 ?? 0
			// total_value = subtotal + (subtotal * fee / 100) or similar logic?
			// Previous logic: subtotal + subtotal * (order.service_fee_60 / 100)
			const total_value = subtotal + subtotal * (fee / 100)

			const partnerData = customer.partners
			const partner = Array.isArray(partnerData) ? partnerData[0] : partnerData

			const sellerData = order.sellers
			const seller = Array.isArray(sellerData) ? sellerData[0] : sellerData

			const creatorData = order.created_by
			const creator = Array.isArray(creatorData) ? creatorData[0] : creatorData

			// Lógica de fallback para Nome do Cliente (PJ vs PF)
			const resolvedCustomerName = customer.company_name || customer.name || "N/A"

			return {
				id: order.id,
				customerId: customer.id,
				kdi: order.kdi,
				cnpj: customer.cnpj || "N/A",
				company_name: customer.company_name || "N/A",
				customer_name: resolvedCustomerName,
				customer_type: (customer.type as "pf" | "pj") || "pj",
				city: customer.city || "N/A",
				state: customer.state || "N/A",
				partner_name: partner?.legal_business_name || "N/A",
				internal_manager: seller?.name || null,
				system_power: order.system_power,
				total_value,
				status: order.status,
				created_at: order.created_at,
				created_by_user: creator?.name || "N/A",
				notes: order.notes
			}
		})

		return mappedData.filter((d): d is OrderWithRelations => d !== null)
	} catch (error) {
		console.error("Erro inesperado em getAllOrders:", error)
		return []
	}
}

export default getAllOrders
