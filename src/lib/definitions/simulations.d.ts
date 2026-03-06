import type { Database } from "@/lib/definitions/supabase"

export type Simulation = Database["public"]["Tables"]["simulations"]["Row"]
export type SimulationInsert = Database["public"]["Tables"]["simulations"]["Insert"]
export type SimulationStatus = Database["public"]["Enums"]["enum_simulation_status"]

// Novo tipo para a view que vamos criar ou para o retorno da nossa query customizada
export type SimulationWithRelations = {
	id: string
	customerId: string
	kdi: number
	cnpj: string
	company_name: string
	city: string
	state: string
	partner_name: string
	internal_manager: string | null
	system_power: number
	total_value: number
	status: SimulationStatus
	created_at: string
	created_by_user: string
}
