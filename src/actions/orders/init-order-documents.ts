"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { documentFieldsPF, documentFieldsPJ, type DocumentFieldDef } from "@/lib/constants"
import type { ActionResponse } from "@/types/action-response"

/**
 * Inicializa os registros de documentos para um pedido na tabela order_documents.
 * Chamado quando o status de credito muda para analysis_approved.
 */
async function initOrderDocuments(
	orderId: string,
	customerType: "pf" | "pj"
): Promise<ActionResponse<{ count: number }>> {
	if (!orderId) {
		return { success: false, message: "ID do pedido nao fornecido." }
	}

	const supabase = createAdminClient()

	try {
		// Verifica se ja existem registros para este pedido
		const { data: existing, error: checkError } = await (supabase as any)
			.from("order_documents")
			.select("id")
			.eq("order_id", orderId)
			.limit(1)

		if (checkError) {
			console.error("Erro ao verificar order_documents existentes:", checkError)
			return { success: false, message: "Erro ao verificar documentos existentes." }
		}

		if (existing && existing.length > 0) {
			return {
				success: true,
				message: "Documentos ja foram inicializados para este pedido.",
				data: { count: 0 },
			}
		}

		// Seleciona campos com base no tipo de cliente
		const fields: DocumentFieldDef[] = customerType === "pj" ? documentFieldsPJ : documentFieldsPF

		// Deadline = agora + 20 dias para docs obrigatorios
		const now = new Date()
		const deadline = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000)
		const deadlineStr = deadline.toISOString()

		// Monta registros para inserir
		const records = fields.map((field) => ({
			order_id: orderId,
			field_name: field.name,
			label: field.label,
			doc_subtype: null,
			required: field.required,
			status: "pending",
			rejection_reason: null,
			reviewed_by: null,
			reviewed_at: null,
			uploaded_at: null,
			deadline: field.required ? deadlineStr : null,
		}))

		const { error: insertError } = await (supabase as any)
			.from("order_documents")
			.insert(records)

		if (insertError) {
			console.error("Erro ao inserir order_documents:", insertError)
			return { success: false, message: `Erro ao criar documentos: ${insertError.message}` }
		}

		return {
			success: true,
			message: `${records.length} documentos inicializados com sucesso.`,
			data: { count: records.length },
		}
	} catch (e) {
		console.error("Erro inesperado em initOrderDocuments:", e)
		const errorMessage = e instanceof Error ? e.message : "Ocorreu um erro desconhecido."
		return {
			success: false,
			message: `Erro inesperado: ${errorMessage}`,
		}
	}
}

export default initOrderDocuments
