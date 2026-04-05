/**
 * Query Supabase compartilhada para buscar pedidos com relações.
 * Arquivo separado (sem "use server") para poder exportar constantes.
 */
export const ORDER_SELECT_QUERY = `
	id,
	kdi,
	system_power,
	equipment_value,
	labor_value,
	other_costs,
	created_at,
	status,
	order_status,
	deadline,
	notes,
	service_fee_60,
	customer_id,
	customers (
		id,
		name,
		cnpj,
		cpf,
		company_name,
		city,
		state,
		type,
		partners ( contact_name, legal_business_name )
	),
	sellers ( name ),
	created_by:created_by_user_id ( name )
`
