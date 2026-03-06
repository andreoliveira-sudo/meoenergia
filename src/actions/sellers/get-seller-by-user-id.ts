// src/actions/sellers/get-seller-by-user-id.ts
"use server"

import type { Seller } from "@/lib/definitions/sellers"
import { createClient } from "@/lib/supabase/server"
import type { ActionResponse } from "@/types/action-response"

/**
 * Busca os detalhes de um vendedor pelo ID do usuário associado a ele.
 * @param userId O UUID do usuário da tabela auth.users.
 * @returns Um objeto Seller se encontrado, ou null caso contrário.
 */
async function getSellerByUserId(userId: string): Promise<ActionResponse<Seller | null>> {
	if (!userId) {
		return { success: false, message: "ID do usuário não fornecido." }
	}

	try {
		const supabase = await createClient()

		const { data: seller, error } = await supabase.from("sellers").select("*").eq("user_id", userId).maybeSingle()

		if (error) {
			console.error("Erro ao buscar vendedor por User ID:", error)
			return { success: false, message: "Erro ao consultar o banco de dados." }
		}

		if (seller) {
			return { success: true, message: "Vendedor encontrado.", data: seller }
		}

		return { success: true, message: "Nenhum vendedor associado a este usuário.", data: null }
	} catch (e) {
		console.error("Erro inesperado em getSellerByUserId:", e)
		return { success: false, message: "Ocorreu um erro inesperado no servidor." }
	}
}

export default getSellerByUserId
