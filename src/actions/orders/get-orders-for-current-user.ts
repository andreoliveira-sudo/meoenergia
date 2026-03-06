"use server"
// src/actions/orders/get-orders-for-current-user.ts

import { getCurrentUser } from "@/actions/auth"
import type { OrderWithRelations } from "@/lib/definitions/orders"
import { createAdminClient } from "@/lib/supabase/admin"
import getAllOrders from "./get-all-orders" // Assumindo que existe um getAllOrders similar

/**
 * Busca pedidos com base na função do usuário logado.
 * - Admin: Vê todos os pedidos.
 * - Seller: Vê apenas os pedidos de clientes associados a ele.
 * - Partner: Vê os pedidos de clientes associados a ele.
 */
async function getOrdersForCurrentUser(): Promise<OrderWithRelations[]> {
	const user = await getCurrentUser()
	const supabase = createAdminClient()

	if (!user || !user.id || !user.role) {
		console.error("Usuário não autenticado ou sem função definida.")
		return []
	}

	if (user.role === "admin") {
		return await getAllOrders()
	}

	if (user.role === "seller") {
		const { data: seller, error: sellerError } = await supabase.from("sellers").select("id").eq("user_id", user.id).single()

		if (sellerError || !seller) {
			console.error("Vendedor não encontrado para o usuário atual:", sellerError)
			return []
		}

		// Buscar primeiro os customer_ids do vendedor
		const { data: customerIds, error: customerError } = await supabase.from("customers").select("id").eq("internal_manager", seller.id)

		if (customerError) {
			console.error("Erro ao buscar clientes do vendedor:", customerError)
			return []
		}

		if (!customerIds || customerIds.length === 0) {
			return []
		}

		const customerIdArray = customerIds.map((c) => c.id)

		const { data, error } = await supabase
			.from("orders")
			.select(
				`
				id,
				kdi,
				status,
				created_at,
				system_power,
				equipment_value,
				labor_value,
				other_costs,
				customer_id,
				notes,
				customers (
					id,
					cnpj,
					company_name,
					name,
					city,
					state,
					type,
					partners ( contact_name, legal_business_name )
				),
				sellers ( name ),
				service_fee_60,
				created_by:created_by_user_id ( name )
				`
			)
			.in("customer_id", customerIdArray)
			.order("created_at", { ascending: false })

		if (error) {
			console.error("Erro ao buscar pedidos para o vendedor:", error)
			return []
		}

		const finalMappedData: OrderWithRelations[] = data
			.filter((order) => order.customers) // Filtra orders sem customers
			.map((order) => {
				const subtotal = (order.equipment_value || 0) + (order.labor_value || 0) + (order.other_costs || 0)
				const total_value = subtotal + subtotal * (order.service_fee_60 / 100)
				const partner = Array.isArray(order.customers.partners) ? order.customers.partners[0] : order.customers.partners

				return {
					id: order.id,
					customerId: order.customers.id,
					kdi: order.kdi,
					cnpj: order.customers.cnpj || "N/A",
					company_name: order.customers.company_name || "N/A",
					customer_name: order.customers.company_name || order.customers.name || "N/A",
					customer_type: (order.customers as any).type || "pj",
					city: order.customers.city || "N/A",
					state: order.customers.state || "N/A",
					partner_name: partner?.legal_business_name || "N/A",
					internal_manager: order.sellers?.name || null,
					system_power: order.system_power,
					total_value,
					status: order.status,
					created_at: order.created_at,
					created_by_user: order.created_by?.name || "N/A",
					notes: order.notes
				}
			})

		return finalMappedData
	}

	if (user.role === "partner") {
		const { data: partner, error: partnerError } = await supabase.from("partners").select("id").eq("user_id", user.id).single()

		if (partnerError || !partner) {
			console.error("Parceiro não encontrado para o usuário atual:", partnerError)
			return []
		}

		// Buscar primeiro os customer_ids do parceiro
		const { data: customerIds, error: customerError } = await supabase.from("customers").select("id").eq("partner_id", partner.id)

		if (customerError) {
			console.error("Erro ao buscar clientes do parceiro:", customerError)
			return []
		}

		if (!customerIds || customerIds.length === 0) {
			return []
		}

		const customerIdArray = customerIds.map((c) => c.id)

		const { data, error } = await supabase
			.from("orders")
			.select(
				`
				id,
				kdi,
				status,
				created_at,
				system_power,
				equipment_value,
				labor_value,
				other_costs,
				customer_id,
				notes,
				customers (
					id,
					cnpj,
					company_name,
					name,
					city,
					state,
					type,
					partners ( contact_name, legal_business_name )
				),
				sellers ( name ),
				service_fee_60,
				created_by:created_by_user_id ( name )
				`
			)
			.in("customer_id", customerIdArray)
			.order("created_at", { ascending: false })

		if (error) {
			console.error("Erro ao buscar pedidos para o parceiro:", error)
			return []
		}

		const finalMappedData: OrderWithRelations[] = data
			.filter((order) => order.customers) // Filtra orders sem customers
			.map((order) => {
				const subtotal = (order.equipment_value || 0) + (order.labor_value || 0) + (order.other_costs || 0)
				const total_value = subtotal + subtotal * (order.service_fee_60 / 100)
				const partner = Array.isArray(order.customers.partners) ? order.customers.partners[0] : order.customers.partners

				return {
					id: order.id,
					customerId: order.customers.id,
					kdi: order.kdi,
					cnpj: order.customers.cnpj || "N/A",
					company_name: order.customers.company_name || "N/A",
					customer_name: order.customers.company_name || order.customers.name || "N/A",
					customer_type: (order.customers as any).type || "pj",
					city: order.customers.city || "N/A",
					state: order.customers.state || "N/A",
					partner_name: partner?.legal_business_name || "N/A",
					internal_manager: order.sellers?.name || null,
					system_power: order.system_power,
					total_value,
					status: order.status,
					created_at: order.created_at,
					created_by_user: order.created_by?.name || "N/A",
					notes: order.notes
				}
			})

		return finalMappedData
	}

	return []
}

export default getOrdersForCurrentUser
