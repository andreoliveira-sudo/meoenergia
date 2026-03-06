"use server"

import type { Equipment } from "@/lib/definitions/equipments"
import { createClient } from "@/lib/supabase/server"

async function getEquipmentsByBrandAndType(typeId: string, brandId: string | null): Promise<Equipment[]> {
	if (!typeId) return []

	try {
		const supabase = await createClient()
		let query = supabase.from("equipments").select("*").eq("type_id", typeId)

		if (brandId) {
			query = query.eq("brand_id", brandId)
		} else {
			query = query.is("brand_id", null)
		}

		const { data, error } = await query.order("name")

		if (error) {
			console.error("Erro ao buscar equipamentos:", error)
			return []
		}

		return data || []
	} catch (error) {
		console.error("Erro inesperado em getEquipmentsByBrandAndType:", error)
		return []
	}
}

export default getEquipmentsByBrandAndType
