"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import type { ActionResponse } from "@/types/action-response"

interface DeletePartnerParams {
	partnerId: string
	userId: string
}

async function deletePartner({ partnerId, userId }: DeletePartnerParams): Promise<ActionResponse<{ partnerId: string }>> {
	if (!partnerId) {
		return { success: false, message: "ID do parceiro não fornecido." }
	}

	try {
		const supabase = createAdminClient()

		// Soft delete do parceiro
		const { error } = await supabase
			.from("partners")
			.update({ deleted_at: new Date().toISOString() })
			.eq("id", partnerId)
			.is("deleted_at", null)

		if (error) {
			console.error("Erro ao deletar partner (Supabase):", error)
			return {
				success: false,
				message: "Erro ao deletar o parceiro. Por favor, tente novamente."
			}
		}

		// Desativar o usuário no Auth (não deletar)
		if (userId) {
			const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
				ban_duration: "876600h"
			})
			if (authError) {
				console.error("Erro ao desativar usuário do parceiro:", authError)
			}
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
