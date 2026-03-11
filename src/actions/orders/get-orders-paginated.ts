"use server"

import { getCurrentUser } from "@/actions/auth"
import type { OrderStatus, OrderWithRelations } from "@/lib/definitions/orders"
import { createAdminClient } from "@/lib/supabase/admin"
import { mapOrderToRelation } from "./map-order-to-relation"
import { ORDER_SELECT_QUERY } from "./order-query"

export interface OrdersFilter {
	search?: string
	type?: "pf" | "pj"
	status?: OrderStatus[]
	state?: string[]
	city?: string[]
	partnerName?: string[]
	internalManager?: string[]
	createdByUser?: string[]
	dateFrom?: string
	dateTo?: string
}

export interface PaginatedOrdersResult {
	data: OrderWithRelations[]
	totalCount: number
	facets: {
		states: string[]
		cities: string[]
		partners: string[]
		managers: string[]
		creators: string[]
	}
}

/**
 * Busca pedidos com paginação e filtros server-side.
 * Usa createAdminClient() para bypassar RLS.
 *
 * Estratégia: busca todos os registros que o usuário tem acesso,
 * aplica filtros em memória no servidor, e retorna a página solicitada.
 * Isso garante facetas (valores únicos para filtros) corretas e paginação precisa.
 */
export async function getOrdersPaginated(
	page: number,
	pageSize: number,
	filters: OrdersFilter = {},
	sortBy: string = "created_at",
	sortDesc: boolean = true
): Promise<PaginatedOrdersResult> {
	const emptyResult: PaginatedOrdersResult = {
		data: [],
		totalCount: 0,
		facets: { states: [], cities: [], partners: [], managers: [], creators: [] }
	}

	try {
		const user = await getCurrentUser()

		if (!user || !user.id || !user.role) {
			return emptyResult
		}

		const supabase = createAdminClient()

		// 1. Determinar customer_ids baseado no role do usuário
		let customerIdFilter: string[] | null = null // null = sem filtro (admin)

		if (user.role === "seller") {
			const { data: seller } = await supabase.from("sellers").select("id").eq("user_id", user.id).is("deleted_at", null).single()
			if (!seller) return emptyResult

			const { data: customerIds } = await supabase.from("customers").select("id").eq("internal_manager", seller.id).is("deleted_at", null)
			customerIdFilter = customerIds?.map((c) => c.id) || []

			if (customerIdFilter.length === 0) return emptyResult
		} else if (user.role === "partner") {
			const { data: partner } = await supabase.from("partners").select("id").eq("user_id", user.id).is("deleted_at", null).single()
			if (!partner) return emptyResult

			const { data: customerIds } = await supabase.from("customers").select("id").eq("partner_id", partner.id).is("deleted_at", null)
			customerIdFilter = customerIds?.map((c) => c.id) || []

			if (customerIdFilter.length === 0) return emptyResult
		}
		// admin: customerIdFilter permanece null (sem filtro)

		// 2. Buscar todos os pedidos acessíveis em lotes
		const allRawData: any[] = []
		const BATCH_SIZE = 1000
		let from = 0

		while (true) {
			let query = supabase
				.from("orders")
				.select(ORDER_SELECT_QUERY)
				.is("deleted_at", null)
				.order("created_at", { ascending: false })
				.range(from, from + BATCH_SIZE - 1)

			if (customerIdFilter !== null) {
				query = query.in("customer_id", customerIdFilter)
			}

			// Aplicar filtros que podem ser feitos no Supabase (performance)
			if (filters.status && filters.status.length > 0) {
				query = query.in("status", filters.status)
			}
			if (filters.dateFrom) {
				const localStart = new Date(`${filters.dateFrom}T00:00:00`); query = query.gte("created_at", localStart.toISOString())
			}
			if (filters.dateTo) {
				const localEnd = new Date(`${filters.dateTo}T23:59:59.999`); query = query.lte("created_at", localEnd.toISOString())
			}

			const { data, error } = await query

			if (error) {
				console.error("Erro ao buscar pedidos paginados:", error)
				return emptyResult
			}

			if (!data || data.length === 0) break

			allRawData.push(...data)

			if (data.length < BATCH_SIZE) break
			from += BATCH_SIZE
		}

		// 3. Mapear para OrderWithRelations
		let allOrders = allRawData
			.map(mapOrderToRelation)
			.filter((d): d is OrderWithRelations => d !== null)

		// 4. Aplicar filtros que requerem dados mapeados (relações)
		if (filters.type) {
			allOrders = allOrders.filter((o) => o.customer_type === filters.type)
		}

		if (filters.search) {
			const searchLower = filters.search.toLowerCase()
			allOrders = allOrders.filter(
				(o) =>
					o.customer_name.toLowerCase().includes(searchLower) ||
					o.company_name.toLowerCase().includes(searchLower) ||
					o.cnpj.includes(filters.search!)
			)
		}

		if (filters.state && filters.state.length > 0) {
			allOrders = allOrders.filter((o) => filters.state!.includes(o.state))
		}

		if (filters.city && filters.city.length > 0) {
			allOrders = allOrders.filter((o) => filters.city!.includes(o.city))
		}

		if (filters.partnerName && filters.partnerName.length > 0) {
			allOrders = allOrders.filter((o) => filters.partnerName!.includes(o.partner_name))
		}

		if (filters.internalManager && filters.internalManager.length > 0) {
			allOrders = allOrders.filter((o) => o.internal_manager !== null && filters.internalManager!.includes(o.internal_manager))
		}

		if (filters.createdByUser && filters.createdByUser.length > 0) {
			allOrders = allOrders.filter((o) => filters.createdByUser!.includes(o.created_by_user))
		}

		// 5. Calcular facetas ANTES da paginação (para filtros dinâmicos)
		const statesSet = new Set<string>()
		const citiesSet = new Set<string>()
		const partnersSet = new Set<string>()
		const managersSet = new Set<string>()
		const creatorsSet = new Set<string>()

		for (const order of allOrders) {
			if (order.state && order.state !== "N/A") statesSet.add(order.state)
			if (order.city && order.city !== "N/A") citiesSet.add(order.city)
			if (order.partner_name && order.partner_name !== "N/A") partnersSet.add(order.partner_name)
			if (order.internal_manager) managersSet.add(order.internal_manager)
			if (order.created_by_user && order.created_by_user !== "N/A") creatorsSet.add(order.created_by_user)
		}

		// 6. Ordenar
		const sortKey = sortBy as keyof OrderWithRelations
		allOrders.sort((a, b) => {
			const aVal = a[sortKey]
			const bVal = b[sortKey]
			if (aVal === null || aVal === undefined) return 1
			if (bVal === null || bVal === undefined) return -1
			if (aVal < bVal) return sortDesc ? 1 : -1
			if (aVal > bVal) return sortDesc ? -1 : 1
			return 0
		})

		// 7. Paginar
		const totalCount = allOrders.length
		const startIndex = page * pageSize
		const paginatedData = allOrders.slice(startIndex, startIndex + pageSize)

		return {
			data: paginatedData,
			totalCount,
			facets: {
				states: Array.from(statesSet).sort(),
				cities: Array.from(citiesSet).sort(),
				partners: Array.from(partnersSet).sort(),
				managers: Array.from(managersSet).sort(),
				creators: Array.from(creatorsSet).sort()
			}
		}
	} catch (error) {
		console.error("Erro inesperado em getOrdersPaginated:", error)
		return emptyResult
	}
}
