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

		// 3. If we have DB records, use them; otherwise build defaults from field definitions
		if (dbDocs && dbDocs.length > 0) {
			const result: OrderDocumentView[] = (dbDocs as OrderDocumentRow[]).map((doc) => {
				// Determine subtypes from the field definitions
				const type = customerType || "pf"
				const fields: DocumentFieldDef[] = type === "pj" ? documentFieldsPJ : documentFieldsPF
				const fieldDef = fields.find((f) => f.name === doc.field_name)

				// Check if file exists - could be stored as field_name or field_name_subtype
				let hasFile = uploadedFileNames.has(doc.field_name)
				if (!hasFile && doc.doc_subtype) {
					const subtypeKey = `${doc.field_name}_${doc.doc_subtype.replace(/\s+/g, "_")}`
					hasFile = uploadedFileNames.has(subtypeKey)
				}
				// Also check any file that starts with the field_name
				if (!hasFile) {
					for (const fname of uploadedFileNames) {
						if (fname.startsWith(doc.field_name)) {
							hasFile = true
							break
						}
					}
				}

				return {
					id: doc.id,
					field_name: doc.field_name,
					label: doc.label,
					required: doc.required,
					doc_subtype: doc.doc_subtype,
					status: doc.status,
					rejection_reason: doc.rejection_reason,
					hasFile,
					subtypes: fieldDef?.subtypes || [],
					deadline: doc.deadline,
					reviewed_by: doc.reviewed_by,
					reviewed_at: doc.reviewed_at,
					uploaded_at: doc.uploaded_at,
				}
			})

			return {
				success: true,
				message: "Documentos encontrados.",
				data: result,
			}
		}

		// 4. No DB records - build defaults from field definitions
		const type = customerType || "pf"
		const fields: DocumentFieldDef[] = type === "pj" ? documentFieldsPJ : documentFieldsPF

		const result: OrderDocumentView[] = fields.map((field) => {
			let hasFile = uploadedFileNames.has(field.name)
			if (!hasFile) {
				for (const fname of uploadedFileNames) {
					if (fname.startsWith(field.name)) {
						hasFile = true
						break
					}
				}
			}

			return {
				id: null,
				field_name: field.name,
				label: field.label,
				required: field.required,
				doc_subtype: null,
				status: hasFile ? "uploaded" as const : "pending" as const,
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
			message: "Documentos gerados a partir dos campos padrao.",
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
