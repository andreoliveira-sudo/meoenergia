"use server"

import { getCurrentUser } from "@/actions/auth"
import type { OrderWorkflowStatus } from "@/lib/definitions/orders"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

interface UpdateOrderWorkflowStatusParams {
	orderId: string
	orderStatus: OrderWorkflowStatus
}

export async function updateOrderWorkflowStatus({ orderId, orderStatus }: UpdateOrderWorkflowStatusParams) {
	try {
		const user = await getCurrentUser()
		if (!user) {
			return { success: false, message: "Usuário não autenticado" }
		}

		const supabase = createAdminClient()

		const { error } = await supabase
			.from("orders")
			.update({ order_status: orderStatus } as any)
			.eq("id", orderId)

		if (error) {
			console.error("Erro ao atualizar order_status:", error)
			return { success: false, message: error.message }
		}

		revalidatePath("/dashboard/orders")
		return { success: true, message: "Status do pedido atualizado com sucesso" }
	} catch (error) {
		console.error("Erro inesperado:", error)
		return { success: false, message: "Erro interno ao atualizar status" }
	}
}
