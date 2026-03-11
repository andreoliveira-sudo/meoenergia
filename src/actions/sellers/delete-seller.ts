"use server"

import { createAdminClient } from "@/lib/supabase/admin"
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
		const supabase = createAdminClient()

		// Soft delete do vendedor
		const { error } = await supabase
			.from("sellers")
			.update({ deleted_at: new Date().toISOString() })
			.eq("id", sellerId)
			.is("deleted_at", null)

		if (error) {
			console.error("Erro ao deletar seller (Supabase):", error)
			return {
				success: false,
				message: "Erro ao deletar o vendedor. Por favor, tente novamente."
			}
		}

		// Desativar o usuário no Auth (não deletar)
		if (userId) {
			const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
				ban_duration: "876600h"
			})
			if (authError) {
				console.error("Erro ao desativar usuário do vendedor:", authError)
			}
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
