"use server"

import { createClient } from "@/lib/supabase/server"
import type { ActionResponse } from "@/types/action-response"

interface DeleteSellerParams {
	sellerId: string
	userId: string
}

async function deleteSeller({ sellerId, userId }: DeleteSellerParams): Promise<ActionResponse<{ sellerId: string }>> {
	if (!sellerId) {
		return { success: false, message: "ID do vendedor não fornecido." }
	}

	try {
		const supabase = await createClient()

		const { error } = await supabase.from("sellers").delete().eq("id", sellerId)

		if (error) {
			console.error("Erro ao deletar seller (Supabase):", error)

			if (error.code === "23503") {
				// Foreign key violation
				return {
					success: false,
					message: "Não é possível deletar este vendedor, pois ele está associado a algum cliente."
				}
			}

			return {
				success: false,
				message: "Erro ao deletar o vendedor. Por favor, tente novamente."
			}
		}

		const { error: rpcError } = await supabase.rpc("delete_user_with_auth", { target_user_id: userId })
		if (rpcError) {
			throw rpcError
		}

		return {
			success: true,
			message: "Vendedor deletado com sucesso.",
			data: { sellerId }
		}
	} catch (e) {
		console.error("Erro inesperado em deleteSeller:", e)
		const errorMessage = e instanceof Error ? e.message : "Ocorreu um erro desconhecido."
		return {
			success: false,
			message: `Ocorreu um erro inesperado: ${errorMessage}`
		}
	}
}

export default deleteSeller
