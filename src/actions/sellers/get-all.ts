"use server"

import type { Seller } from "@/lib/definitions/sellers"
import { createAdminClient } from "@/lib/supabase/admin"

async function getAllSellers(): Promise<Seller[]> {
	try {
		const supabase = createAdminClient()

		const { data: sellers, error } = await supabase.from("sellers").select("*").is("deleted_at", null)

		if (error) {
			console.error("Erro na consulta:", error)
			throw new Error("Erro ao buscar vendedores no banco de dados")
		}
		return sellers || []
	} catch (error) {
		console.error("Erro ao buscar vendedores:", error)
		return []
	}
}

export default getAllSellers
