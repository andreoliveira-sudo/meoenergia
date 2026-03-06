"use server"

import { PostgrestError } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/server"
import type { ActionResponse } from "@/types/action-response"

async function rejectPartner(partnerId: string): Promise<ActionResponse<{ partnerId: string }>> {
	if (!partnerId) {
		return {
			success: false,
			message: "ID do parceiro não fornecido."
		}
	}

	try {
		const supabase = await createClient()

		const { error, count } = await supabase.from("partners").update({ status: "rejected", is_active: false }).eq("id", partnerId).select()

		if (error) {
			console.error("Erro ao rejeitar parceiro (Supabase):", error)
			return {
				success: false,
				message: "Erro ao atualizar o status do parceiro. Por favor, tente novamente."
			}
		}

		if (count === 0) {
			return {
				success: false,
				message: "Nenhum parceiro encontrado com o ID fornecido. A rejeição falhou."
			}
		}

		return {
			success: true,
			message: "Parceiro rejeitado com sucesso!",
			data: {
				partnerId
			}
		}
	} catch (error) {
		console.error("Erro inesperado na action 'rejectPartner':", error)

		if (error instanceof PostgrestError) {
			return {
				success: false,
				message: `Ocorreu um problema de comunicação com o sistema. Código: ${error.code}`
			}
		}

		return {
			success: false,
			message: "Ocorreu um erro inesperado. Por favor, contate o suporte."
		}
	}
}

export default rejectPartner
