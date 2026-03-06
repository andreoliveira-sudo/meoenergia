"use server"

import { createClient } from "@/lib/supabase/server"
import type { ActionResponse } from "@/types/action-response"

interface DeletePartnerParams {
	partnerId: string
	userId: string
}

async function deletePartner({ partnerId, userId }: DeletePartnerParams): Promise<ActionResponse<{ partnerId: string }>> {
	if (!partnerId) {
		return { success: false, message: "ID do cliente não fornecido." }
	}

	try {
		const supabase = await createClient()

		const { error } = await supabase.from("partners").delete().eq("id", partnerId)

		if (error) {
			console.error("Erro ao deletar partner (Supabase):", error)

			if (error.code === "23503") {
				// Foreign key violation
				return {
					success: false,
					message: "Não é possível deletar este parceiro, pois ele está associado a algum cliente."
				}
			}

			return {
				success: false,
				message: "Erro ao deletar o parceiro. Por favor, tente novamente."
			}
		}

		const { error: rpcError } = await supabase.rpc("delete_user_with_auth", { target_user_id: userId })
		if (rpcError) {
			throw rpcError
		}

		return {
			success: true,
			message: "Parceiro deletado com sucesso.",
			data: { partnerId }
		}
	} catch (e) {
		console.error("Erro inesperado em deletePartner:", e)
		const errorMessage = e instanceof Error ? e.message : "Ocorreu um erro desconhecido."
		return {
			success: false,
			message: `Ocorreu um erro inesperado: ${errorMessage}`
		}
	}
}

export default deletePartner
