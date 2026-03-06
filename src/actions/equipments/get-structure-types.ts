"use server"

import type { StructureType } from "@/lib/definitions/equipments"
import { createClient } from "@/lib/supabase/server"

async function getStructureTypes(): Promise<StructureType[]> {
	try {
		const supabase = await createClient()
		const { data, error } = await supabase.from("structure_types").select("*").order("name")

		if (error) {
			console.error("Erro ao buscar tipos de estrutura:", error)
			return []
		}

		return data || []
	} catch (error) {
		console.error("Erro inesperado em getStructureTypes:", error)
		return []
	}
}

export default getStructureTypes
