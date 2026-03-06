"use server"

import { PostgrestError } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

import type { OrderStatus } from "@/lib/definitions/orders"
import { createClient } from "@/lib/supabase/server"
import type { ActionResponse } from "@/types/action-response"
import { handleOrderStatusChange } from "@/lib/events/order-events"

interface UpdateOrderStatusParams {
	orderId: string
	status: OrderStatus
}

async function updateOrderStatus({ orderId, status }: UpdateOrderStatusParams): Promise<ActionResponse<{ orderId: string }>> {
	if (!orderId) {
		return { success: false, message: "ID do pedido não fornecido." }
	}
	if (!status) {
		return { success: false, message: "Novo status não fornecido." }
	}

	const supabase = await createClient()

	try {
		const { error, count } = await supabase.from("orders").update({ status }, { count: "exact" }).eq("id", orderId)

		if (error) {
			console.error("Erro ao atualizar status do pedido (Supabase):", error)
			if (error instanceof PostgrestError) {
				return { success: false, message: `Erro no banco de dados: ${error.message}` }
			}
			return { success: false, message: "Ocorreu um erro ao tentar atualizar o status." }
		}

		if (count === 0) {
			return { success: false, message: "Nenhum pedido encontrado com o ID fornecido." }
		}


		revalidatePath("/dashboard/orders")

		// Obter usuário atual para o log
		const { data: { user } } = await supabase.auth.getUser()
		const authorId = user?.id

		// Disparar notificação (Fire and forget, sem await para não travar response)
		// Precisamos importar handleOrderStatusChange
		handleOrderStatusChange(orderId, status, authorId).catch(err => console.error("Erro ao enviar notificação:", err))

		return {
			success: true,
			message: "Status do pedido atualizado com sucesso!",
			data: { orderId }
		}
	} catch (e) {
		console.error("Erro inesperado em updateOrderStatus:", e)
		return { success: false, message: "Ocorreu um erro inesperado no servidor." }
	}
}

export default updateOrderStatus
