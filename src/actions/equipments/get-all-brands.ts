"use server"

import type { EquipmentBrand } from "@/lib/definitions/equipments"
import { createClient } from "@/lib/supabase/server"

async function getAllBrands(): Promise<EquipmentBrand[]> {
	try {
		const supabase = await createClient()
		const { data, error } = await supabase.from("equipment_brands").select("*").order("name")

		if (error) {
			console.error("Erro ao buscar marcas:", error)
			return []
		}

		return data || []
	} catch (error) {
		console.error("Erro inesperado em getAllBrands:", error)
		return []
	}
}

export default getAllBrands
