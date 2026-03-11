"use server"

import { getCurrentUser } from "@/actions/auth"
import type { OrderWithRelations } from "@/lib/definitions/orders"
import { createAdminClient } from "@/lib/supabase/admin"
import { mapOrderToRelation } from "./map-order-to-relation"
import { ORDER_SELECT_QUERY } from "./order-query"

/**
 * Busca TODOS os pedidos do sistema.
 * Usa createAdminClient() para bypassar RLS e garantir acesso completo.
 * Faz fetch em lotes de 1000 para evitar o limite padrão do Supabase.
 */
async function getAllOrders(): Promise<OrderWithRelations[]> {
	try {
		const user = await getCurrentUser()

		if (!user || !user.id || !user.role) {
			console.error("Usuário não autenticado ou sem função definida.")
			return []
		}

		const supabase = createAdminClient()
		const isAdmin = user.role === "admin"

		// Busca em lotes de 1000 para evitar truncamento silencioso do Supabase
		const allData: any[] = []
		const PAGE_SIZE = 1000
		let from = 0

		while (true) {
			let query = supabase
				.from("orders")
				.select(ORDER_SELECT_QUERY)
				.is("deleted_at", null)
				.order("created_at", { ascending: false })
				.range(from, from + PAGE_SIZE - 1)

			if (!isAdmin) {
				query = query.eq("created_by_user_id", user.id)
			}

			const { data, error } = await query

			if (error) {
				console.error("Erro ao buscar pedidos:", error)
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
	} catch (error) {
		console.error("Erro inesperado em getAllOrders:", error)
		return []
	}
}

export default getAllOrders
