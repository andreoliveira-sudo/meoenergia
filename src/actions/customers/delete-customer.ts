"use server"

import { createClient } from "@/lib/supabase/server"
import type { ActionResponse } from "@/types/action-response"

async function deleteCustomer(customerId: string): Promise<ActionResponse<{ customerId: string }>> {
	if (!customerId) {
		return { success: false, message: "ID do cliente não fornecido." }
	}

	try {
		const supabase = await createClient()

		const { error } = await supabase.from("customers").delete().eq("id", customerId)

		if (error) {
			console.error("Erro ao deletar customer (Supabase):", error)

			if (error.code === "23503") {
				// Foreign key violation
				return {
					success: false,
					message: "Não é possível deletar este cliente, pois ele está associado a uma ou mais simulações ou pedidos."
				}
			}

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
