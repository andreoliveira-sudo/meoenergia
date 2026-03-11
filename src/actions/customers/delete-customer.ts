"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import type { ActionResponse } from "@/types/action-response"

async function deleteCustomer(customerId: string): Promise<ActionResponse<{ customerId: string }>> {
	if (!customerId) {
		return { success: false, message: "ID do cliente não fornecido." }
	}

	try {
		const supabase = createAdminClient()

		const { error } = await supabase
			.from("customers")
			.update({ deleted_at: new Date().toISOString() })
			.eq("id", customerId)
			.is("deleted_at", null)

		if (error) {
			console.error("Erro ao deletar customer (Supabase):", error)
			return {
				success: false,
				message: "Erro ao deletar o cliente. Por favor, tente novamente."
			}
		}

		return {
			success: true,
			message: "Cliente deletado com sucesso.",
			data: { customerId }
		}
	} catch (e) {
		console.error("Erro inesperado em deleteCustomer:", e)
		const errorMessage = e instanceof Error ? e.message : "Ocorreu um erro desconhecido."
		return {
			success: false,
			message: `Ocorreu um erro inesperado: ${errorMessage}`
		}
	}
}

export default deleteCustomer
