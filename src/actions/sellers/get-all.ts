"use server"

import type { Seller } from "@/lib/definitions/sellers"
import { createClient } from "@/lib/supabase/server"

async function getAllSellers(): Promise<Seller[]> {
	try {
		const supabase = await createClient()

		const { data: sellers, error } = await supabase.from("sellers").select("*")

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
