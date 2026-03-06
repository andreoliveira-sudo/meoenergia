"use server"

import { PostgrestError } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import type { ActionResponse } from "@/types/action-response"

async function deleteOrder(orderId: string): Promise<ActionResponse<null>> {
	if (!orderId) {
		return { success: false, message: "ID do Pedido não fornecido." }
	}

	const supabase = await createClient()

	try {
		const { error } = await supabase.from("orders").delete().eq("id", orderId)

		if (error) {
			console.error("Erro ao deletar pedido (Supabase):", error)
			throw error
		}

		revalidatePath("/dashboard/orders")

		return {
			success: true,
			data: null,
			message: "Pedido deletado com sucesso."
		}
	} catch (error) {
		console.error("Erro inesperado em deleteOrder:", error)
		if (error instanceof PostgrestError) {
			return { success: false, message: `Erro no banco de dados: ${error.message}` }
		}
		return { success: false, message: "Ocorreu um erro inesperado. Tente novamente." }
	}
}

export default deleteOrder
