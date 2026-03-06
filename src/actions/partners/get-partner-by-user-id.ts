"use server"

import type { Partner } from "@/lib/definitions/partners"
import { createClient } from "@/lib/supabase/server"
import type { ActionResponse } from "@/types/action-response"

async function getPartnerByUserId(userId: string): Promise<ActionResponse<Partner | null>> {
	if (!userId) {
		return { success: false, message: "ID do usuário não fornecido." }
	}

	try {
		const supabase = await createClient()

		const { data: partner, error } = await supabase.from("partners").select("*").eq("user_id", userId).maybeSingle()

		if (error) {
			console.error("Erro ao buscar parceiro por User ID:", error)
			return { success: false, message: "Erro ao consultar o banco de dados." }
		}

		if (partner) {
			return { success: true, message: "Parceiro encontrado.", data: partner }
		}

		return { success: true, message: "Nenhum parceiro associado a este usuário.", data: null }
	} catch (e) {
		console.error("Erro inesperado em getPartnerByUserId:", e)
		return { success: false, message: "Ocorreu um erro inesperado no servidor." }
	}
}

export default getPartnerByUserId
