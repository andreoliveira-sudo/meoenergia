"use server"

import { getCurrentUser } from "@/actions/auth"
import type { OrderWorkflowStatus } from "@/lib/definitions/orders"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

interface UpdateOrderWorkflowStatusParams {
	orderId: string
	orderStatus: OrderWorkflowStatus
}

/**
 * Calcula deadline baseado no novo status do pedido.
 * - documents_pending: 20 dias (parceiro enviar docs)
 * - docs_analysis: 24h (admin analisar)
 * - documents_issue: 20 dias (parceiro corrigir)
 * - Outros: sem prazo (null)
 */
function calculateDeadline(status: OrderWorkflowStatus): string | null {
	const now = new Date()
	switch (status) {
		// 20 dias — parceiro deve agir
		case "documents_pending":
		case "documents_issue":
		case "awaiting_distributor_docs":
		case "distributor_docs_issue":
		case "awaiting_integrator_docs":
		case "integrator_docs_issue":
		case "awaiting_signature":
			return new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString()

		// 24 horas — admin deve analisar
		case "docs_analysis":
		case "analyzing_distributor_docs":
		case "analyzing_integrator_docs":
			return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()

		// 10 dias — logistica
		case "equipment_separation":
		case "equipment_transit":
			return new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString()

		// Sem prazo — status finais ou iniciais
		case "in_review":
		case "rejected":
		case "finished":
		case "canceled":
		case "equipment_delivered":
		default:
			return null
	}
}

export async function updateOrderWorkflowStatus({ orderId, orderStatus }: UpdateOrderWorkflowStatusParams) {
	try {
		const user = await getCurrentUser()
		if (!user) {
			return { success: false, message: "Usuario nao autenticado" }
		}

		const supabase = createAdminClient()
		const deadline = calculateDeadline(orderStatus)

		const { error } = await supabase
			.from("orders")
			.update({ order_status: orderStatus, deadline } as any)
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
