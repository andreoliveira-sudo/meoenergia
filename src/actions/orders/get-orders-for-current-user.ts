"use server"

import { getCurrentUser } from "@/actions/auth"
import type { OrderWithRelations } from "@/lib/definitions/orders"
import { createAdminClient } from "@/lib/supabase/admin"
import getAllOrders from "./get-all-orders"
import { mapOrderToRelation } from "./map-order-to-relation"
import { ORDER_SELECT_QUERY } from "./order-query"

/**
 * Busca pedidos com base na função do usuário logado.
 * - Admin: Vê todos os pedidos (via getAllOrders).
 * - Seller: Vê apenas os pedidos de clientes associados a ele.
 * - Partner: Vê os pedidos de clientes associados a ele.
 *
 * Usa createAdminClient() para bypassar RLS e garantir acesso consistente.
 */
async function getOrdersForCurrentUser(): Promise<OrderWithRelations[]> {
	const user = await getCurrentUser()

	if (!user || !user.id || !user.role) {
		console.error("Usuário não autenticado ou sem função definida.")
		return []
	}

	if (user.role === "admin") {
		return await getAllOrders()
	}

	const supabase = createAdminClient()

	// Busca customer IDs baseado no role do usuário
	let customerIdArray: string[] = []

	if (user.role === "seller") {
		const { data: seller, error: sellerError } = await supabase.from("sellers").select("id").eq("user_id", user.id).is("deleted_at", null).single()

		if (sellerError || !seller) {
			console.error("Vendedor não encontrado para o usuário atual:", sellerError)
			return []
		}

		const { data: customerIds, error: customerError } = await supabase.from("customers").select("id").eq("internal_manager", seller.id).is("deleted_at", null)

		if (customerError) {
			console.error("Erro ao buscar clientes do vendedor:", customerError)
			return []
		}

		customerIdArray = customerIds?.map((c) => c.id) || []
	} else if (user.role === "partner") {
		const { data: partner, error: partnerError } = await supabase.from("partners").select("id").eq("user_id", user.id).is("deleted_at", null).single()

		if (partnerError || !partner) {
			console.error("Parceiro não encontrado para o usuário atual:", partnerError)
			return []
		}

		const { data: customerIds, error: customerError } = await supabase.from("customers").select("id").eq("partner_id", partner.id).is("deleted_at", null)

		if (customerError) {
			console.error("Erro ao buscar clientes do parceiro:", customerError)
			return []
		}

		customerIdArray = customerIds?.map((c) => c.id) || []
	} else {
		return []
	}

	if (customerIdArray.length === 0) {
		return []
	}

	// Busca pedidos em lotes para evitar truncamento silencioso do Supabase
	const allData: any[] = []
	const PAGE_SIZE = 1000
	let from = 0

	while (true) {
		const { data, error } = await supabase
			.from("orders")
			.select(ORDER_SELECT_QUERY)
			.is("deleted_at", null)
			.in("customer_id", customerIdArray)
			.order("created_at", { ascending: false })
			.range(from, from + PAGE_SIZE - 1)

		if (error) {
			console.error(`Erro ao buscar pedidos para ${user.role}:`, error)
			return []
		}

		if (!data || data.length === 0) break

		allData.push(...data)

		if (data.length < PAGE_SIZE) break
		from += PAGE_SIZE
	}

	return allData
		.map(mapOrderToRelation)
		.filter((d): d is OrderWithRelations => d !== null)
}

export default getOrdersForCurrentUser
