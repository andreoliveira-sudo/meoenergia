"use server"

import type { Seller } from "@/lib/definitions/sellers"
import { createClient } from "@/lib/supabase/server"

async function getAllApprovedSellers(): Promise<Seller[]> {
	try {
		const supabase = await createClient()

		// Modificação: Adicionado filtro para retornar apenas vendedores aprovados E ativos.
		const { data: sellers, error } = await supabase.from("sellers").select("*").eq("status", "approved").eq("is_active", true)

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

export default getAllApprovedSellers
