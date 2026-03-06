"use server"

import type { EquipmentBrand } from "@/lib/definitions/equipments"
import { createClient } from "@/lib/supabase/server"

async function getBrandsByEquipmentType(typeId: string): Promise<Omit<EquipmentBrand, "created_at" | "updated_at">[]> {
	if (!typeId) return []

	try {
		const supabase = await createClient()

		// A sintaxe "equipment!inner(type_id)" força um INNER JOIN,
		// garantindo que apenas marcas com equipamentos correspondentes ao typeId sejam retornadas.
		// O select('id, name') garante que estamos selecionando os campos da tabela equipment_brands.
		const { data, error } = await supabase.from("equipment_brands").select("id, name, equipments!inner(type_id)").eq("equipments.type_id", typeId)

		if (error) {
			console.error("Erro ao buscar marcas de equipamentos por tipo (Supabase):", error)
			return []
		}

		// O distinct é implícito por selecionarmos da tabela de marcas, mas é bom ter em mente a lógica.
		// O Supabase não retorna duplicatas de `equipment_brands` nesta query.
		return data || []
	} catch (error) {
		console.error("Erro inesperado na action 'getBrandsByEquipmentType':", error)
		return []
	}
}

export default getBrandsByEquipmentType
