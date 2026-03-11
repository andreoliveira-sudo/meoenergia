import type { OrderWithRelations } from "@/lib/definitions/orders"

/**
 * Mapeia os dados brutos do Supabase (orders + joins) para OrderWithRelations.
 * Função compartilhada para evitar duplicação entre getAllOrders e getOrdersForCurrentUser.
 */
export function mapOrderToRelation(order: any): OrderWithRelations | null {
	const customerData = order.customers
	const customer = Array.isArray(customerData) ? customerData[0] : customerData

	if (!customer) return null

	const subtotal = (order.equipment_value || 0) + (order.labor_value || 0) + (order.other_costs || 0)
	const fee = order.service_fee_60 ?? 0
	const total_value = subtotal + subtotal * (fee / 100)

	const partnerData = customer.partners
	const partner = Array.isArray(partnerData) ? partnerData[0] : partnerData

	const sellerData = order.sellers
	const seller = Array.isArray(sellerData) ? sellerData[0] : sellerData

	const creatorData = order.created_by
	const creator = Array.isArray(creatorData) ? creatorData[0] : creatorData

	const customerType = customer.type || "pj"
	const resolvedCustomerName = customer.company_name || customer.name || "N/A"

	return {
		id: order.id,
		customerId: customer.id,
		kdi: order.kdi,
		cnpj: customerType === "pf" ? (customer.cpf || "N/A") : (customer.cnpj || "N/A"),
		company_name: customer.company_name || "N/A",
		customer_name: resolvedCustomerName,
		customer_type: customerType,
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
}
