"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import getCurrentUser from "@/actions/auth/get-current-user"
import type { ActionResponse } from "@/types/action-response"

interface ReviewDocumentParams {
	orderId: string
	fieldName: string
	status: "approved" | "rejected"
	rejectionReason?: string
}

/**
 * Aprova ou rejeita um documento especifico de um pedido.
 * Se algum doc for rejeitado, atualiza order status para documents_issue.
 */
async function reviewDocument({
	orderId,
	fieldName,
	status,
	rejectionReason,
}: ReviewDocumentParams): Promise<ActionResponse<{ orderId: string }>> {
	if (!orderId || !fieldName || !status) {
		return { success: false, message: "Parametros incompletos." }
	}

	if (status === "rejected" && !rejectionReason) {
		return { success: false, message: "Motivo da rejeicao e obrigatorio." }
	}

	const supabase = createAdminClient()

	try {
		const currentUser = await getCurrentUser()
		if (!currentUser.id) {
			return { success: false, message: "Usuario nao autenticado." }
		}

		// 1. UPSERT do registro do documento (cria se nao existir)
		// Buscar metadata do campo
		const { documentFieldsPF, documentFieldsPJ } = await import("@/lib/constants")
		const { data: orderInfo } = await (supabase as any)
			.from("orders")
			.select("customers(type)")
			.eq("id", orderId)
			.single()
		const customerType = orderInfo?.customers?.type || "pf"
		const fieldDefs = customerType === "pj" ? documentFieldsPJ : documentFieldsPF
		const fieldDef = fieldDefs.find((f: { name: string; label: string; required: boolean }) => f.name === fieldName)

		const upsertData: Record<string, unknown> = {
			order_id: orderId,
			field_name: fieldName,
			label: fieldDef?.label || fieldName,
			required: fieldDef?.required ?? true,
			status,
			reviewed_by: currentUser.id,
			reviewed_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			rejection_reason: status === "rejected" ? (rejectionReason || null) : null,
		}

		const { error: updateError } = await (supabase as any)
			.from("order_documents")
			.upsert(upsertData, { onConflict: "order_id,field_name" })

		if (updateError) {
			console.error("Erro ao atualizar documento:", updateError)
			return { success: false, message: `Erro ao atualizar documento: ${updateError.message}` }
		}

		// 2. Se rejeitado, atualizar order_status para documents_issue + deadline +20 dias
		if (status === "rejected") {
			const deadline = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString()
			const { error: orderUpdateError } = await supabase
				.from("orders")
				.update({ order_status: "documents_issue", deadline } as any)
				.eq("id", orderId)

			if (orderUpdateError) {
				console.error("Erro ao atualizar order_status do pedido:", orderUpdateError)
			}
		}

		// 3. Se aprovado, verifica se TODOS os docs obrigatorios estao aprovados
		if (status === "approved") {
			const { data: allDocs, error: fetchError } = await (supabase as any)
				.from("order_documents")
				.select("field_name, required, status")
				.eq("order_id", orderId)

			if (!fetchError && allDocs) {
				const requiredDocs = (allDocs as Array<{ field_name: string; required: boolean; status: string }>)
					.filter((d) => d.required)
				const allRequiredApproved = requiredDocs.length > 0 && requiredDocs.every((d) => d.status === "approved")

				if (allRequiredApproved) {
					// Todos os docs obrigatorios aprovados - pode mudar status
					// (Nao muda automaticamente para evitar conflitos, apenas loga)
					console.log(`Todos os documentos obrigatorios aprovados para o pedido ${orderId}`)
				}
			}
		}

		revalidatePath("/dashboard/orders")

		return {
			success: true,
			message: status === "approved" ? "Documento aprovado com sucesso." : "Documento rejeitado.",
			data: { orderId },
		}
	} catch (e) {
		console.error("Erro inesperado em reviewDocument:", e)
		const errorMessage = e instanceof Error ? e.message : "Ocorreu um erro desconhecido."
		return {
			success: false,
			message: `Erro inesperado: ${errorMessage}`,
		}
	}
}

export default reviewDocument
