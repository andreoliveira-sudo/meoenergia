"use server"

import type { EquipmentWithRelations } from "@/lib/definitions/equipments"
import { createClient } from "@/lib/supabase/server"

async function getAllEquipments(): Promise<EquipmentWithRelations[]> {
	try {
		const supabase = await createClient()
		const { data, error } = await supabase
			.from("equipments")
			.select(
				`
        *,
        equipment_types (name),
        equipment_brands (name)
      `
			)
			.order("created_at", { ascending: false })

		if (error) {
			console.error("Erro ao buscar equipamentos:", error)
			return []
		}

		return data || []
	} catch (error) {
		console.error("Erro inesperado em getEquipments:", error)
		return []
	}
}

export default getAllEquipments
