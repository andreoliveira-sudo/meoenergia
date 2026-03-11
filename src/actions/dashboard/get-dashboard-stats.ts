"use server"

import { createClient } from "@/lib/supabase/server"

export interface DashboardStats {
	ordersPF: number
	ordersPJ: number
	ordersToday: number
	ordersAPI: number
	ordersManual: number
	ordersTotalValue: number
	newPartnersToday: number
	newSellersToday: number
}

export async function getDashboardStats(dateFrom?: string, dateTo?: string): Promise<DashboardStats> {
	const supabase = await createClient()

	let startISO: string
	let endISO: string

	if (dateFrom) {
		startISO = new Date(`${dateFrom}T00:00:00`).toISOString()
	} else {
		const now = new Date()
		startISO = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString()
	}

	if (dateTo) {
		endISO = new Date(`${dateTo}T23:59:59.999`).toISOString()
	} else {
		const now = new Date()
		endISO = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString()
	}

	const applyDateFilter = (query: any) => query.gte("created_at", startISO).lte("created_at", endISO)

	const [ordersResult, partnersResult, sellersResult] = await Promise.all([
		applyDateFilter(supabase.from("orders").select("equipment_value, labor_value, other_costs, service_fee_60, api_key_id, customers(type)").is("deleted_at", null)),
		applyDateFilter(supabase.from("partners").select("*", { count: "exact", head: true }).is("deleted_at", null)),
		applyDateFilter(supabase.from("sellers").select("*", { count: "exact", head: true }).is("deleted_at", null))
	])

	let ordersToday = 0
	let ordersPF = 0
	let ordersPJ = 0
	let ordersAPI = 0
	let ordersManual = 0
	let ordersTotalValue = 0

	if (ordersResult.data && ordersResult.data.length > 0) {
		ordersToday = ordersResult.data.length
		ordersResult.data.forEach((order: any) => {
			const customerType = Array.isArray(order.customers) ? order.customers[0]?.type : order.customers?.type
			if (customerType === "pf") ordersPF++
			else if (customerType === "pj") ordersPJ++

			if (order.api_key_id) ordersAPI++
			else ordersManual++

			const subtotal = (order.equipment_value || 0) + (order.labor_value || 0) + (order.other_costs || 0)
			const fee = order.service_fee_60 ?? 0
			const total = subtotal + subtotal * (fee / 100)
			ordersTotalValue += total
		})
	}

	return {
		ordersPF,
		ordersPJ,
		ordersToday,
		ordersAPI,
		ordersManual,
		ordersTotalValue,
		newPartnersToday: partnersResult.count ?? 0,
		newSellersToday: sellersResult.count ?? 0
	}
}
