"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { documentFieldsPF, documentFieldsPJ, type DocumentFieldDef } from "@/lib/constants"
import type { ActionResponse } from "@/types/action-response"
import listOrderFiles from "./list-order-files"

export interface OrderDocumentRow {
	id: string
	order_id: string
	field_name: string
	label: string
	doc_subtype: string | null
	required: boolean
	status: "pending" | "uploaded" | "approved" | "rejected"
	rejection_reason: string | null
	reviewed_by: string | null
	reviewed_at: string | null
	uploaded_at: string | null
	deadline: string | null
	created_at: string
	updated_at: string
}

export interface OrderDocumentView {
	id: string | null
	field_name: string
	label: string
	required: boolean
	doc_subtype: string | null
	status: "pending" | "uploaded" | "approved" | "rejected"
	rejection_reason: string | null
	hasFile: boolean
	subtypes: string[]
	deadline: string | null
	reviewed_by: string | null
	reviewed_at: string | null
	uploaded_at: string | null
}

async function getOrderDocuments(
	orderId: string,
	customerType?: "pf" | "pj"
): Promise<ActionResponse<OrderDocumentView[]>> {
	if (!orderId) {
		return { success: false, message: "ID do pedido nao fornecido." }
	}

	const supabase = createAdminClient()

	try {
		// 1. Fetch order_documents records
		const { data: dbDocs, error: dbError } = await (supabase as any)
			.from("order_documents")
			.select("*")
			.eq("order_id", orderId)
			.order("created_at", { ascending: true })

		if (dbError) {
			console.error("Erro ao buscar order_documents:", dbError)
			return { success: false, message: "Erro ao buscar documentos do pedido." }
		}

		// 2. List files in storage
		const filesResponse = await listOrderFiles(orderId)
		const uploadedFileNames = new Set<string>()
		if (filesResponse.success && filesResponse.data) {
			for (const file of filesResponse.data) {
				// file.name can be "docIdentificacao" or "docIdentificacao_RG" etc
				uploadedFileNames.add(file.name)
			}
		}

		// 3. Mapear dbDocs por field_name para lookup rapido
		const dbDocsMap = new Map<string, OrderDocumentRow>()
		if (dbDocs && dbDocs.length > 0) {
			for (const doc of dbDocs as OrderDocumentRow[]) {
				dbDocsMap.set(doc.field_name, doc)
			}
		}

		// 4. SEMPRE retornar TODOS os campos definidos (PF ou PJ),
		//    mesclando com os registros da tabela quando existirem
		const type = customerType || "pf"
		const fields: DocumentFieldDef[] = type === "pj" ? documentFieldsPJ : documentFieldsPF

		const result: OrderDocumentView[] = fields.map((field) => {
			const dbDoc = dbDocsMap.get(field.name)

			// Verificar se arquivo existe no storage
			let hasFile = uploadedFileNames.has(field.name)
			if (!hasFile && dbDoc?.doc_subtype) {
				const subtypeKey = `${field.name}_${dbDoc.doc_subtype.replace(/\s+/g, "_")}`
				hasFile = uploadedFileNames.has(subtypeKey)
			}
			if (!hasFile) {
				for (const fname of uploadedFileNames) {
					if (fname.startsWith(field.name)) {
						hasFile = true
						break
					}
				}
			}

			if (dbDoc) {
				// Usar dados do banco
				return {
					id: dbDoc.id,
					field_name: dbDoc.field_name,
					label: dbDoc.label || field.label,
					required: dbDoc.required ?? field.required,
					doc_subtype: dbDoc.doc_subtype,
					status: dbDoc.status,
					rejection_reason: dbDoc.rejection_reason,
					hasFile,
					subtypes: field.subtypes || [],
					deadline: dbDoc.deadline,
					reviewed_by: dbDoc.reviewed_by,
					reviewed_at: dbDoc.reviewed_at,
					uploaded_at: dbDoc.uploaded_at,
				}
			}

			// Sem registro no banco: usar defaults
			return {
				id: null,
				field_name: field.name,
				label: field.label,
				required: field.required,
				doc_subtype: null,
				status: hasFile ? ("uploaded" as const) : ("pending" as const),
				rejection_reason: null,
				hasFile,
				subtypes: field.subtypes || [],
				deadline: null,
				reviewed_by: null,
				reviewed_at: null,
				uploaded_at: null,
			}
		})

		return {
			success: true,
			message: "Documentos carregados.",
			data: result,
		}
	} catch (e) {
		console.error("Erro inesperado em getOrderDocuments:", e)
		const errorMessage = e instanceof Error ? e.message : "Ocorreu um erro desconhecido."
		return {
			success: false,
			message: `Erro inesperado: ${errorMessage}`,
		}
	}
}

export default getOrderDocuments
