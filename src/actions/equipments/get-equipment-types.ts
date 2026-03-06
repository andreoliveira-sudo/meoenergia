"use server"

import type { EquipmentType } from "@/lib/definitions/equipments"
import { createClient } from "@/lib/supabase/server"

async function getEquipmentTypes(): Promise<Omit<EquipmentType, "created_at" | "updated_at">[]> {
	try {
		const supabase = await createClient()

		const { data, error } = await supabase.from("equipment_types").select("id, name")

		if (error) {
			console.error("Erro ao buscar tipos de equipamentos (Supabase):", error)
			return []
		}

		return data || []
	} catch (error) {
		console.error("Erro inesperado na action 'getEquipmentTypes':", error)
		return []
	}
}

export default getEquipmentTypes
