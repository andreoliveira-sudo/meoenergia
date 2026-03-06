// src/actions/orders/check-order-documents-status.ts
"use server"

import { revalidatePath } from "next/cache"
import { documentFields } from "@/lib/constants"
import type { ActionResponse } from "@/types/action-response"
import { listOrderFiles, updateOrderStatus } from "."
import { getOrderById } from "."

export interface DocumentStatus {
	name: string
	label: string
	uploaded: boolean
}

async function checkOrderDocumentsStatus(orderId: string): Promise<ActionResponse<DocumentStatus[]>> {
	if (!orderId) {
		return { success: false, message: "ID do pedido não fornecido." }
	}

	try {
		// Busca os dados do pedido, incluindo o status atual
		const orderResponse = await getOrderById(orderId)
		if (!orderResponse.success || !orderResponse.data) {
			return { success: false, message: "Pedido não encontrado para verificação de status." }
		}
		const currentStatus = orderResponse.data.status

		// Lista os arquivos que já foram enviados
		const listResponse = await listOrderFiles(orderId)
		if (!listResponse.success) {
			return { success: false, message: listResponse.message }
		}

		const uploadedFileNames = new Set(listResponse.data.map((file) => file.name))

		// Compara os arquivos enviados com a lista de todos os documentos possíveis
		const documentStatus: DocumentStatus[] = documentFields.map((field) => {
			return {
				name: field.name,
				label: field.label.replace(" *", ""),
				uploaded: uploadedFileNames.has(field.name)
			}
		})

		const allDocumentsUploaded = documentStatus.every((doc) => doc.uploaded)

		// **REGRA ADICIONADA:**
		// Só atualiza o status se todos os docs estiverem lá E o status atual for 'documents_pending'
		if (allDocumentsUploaded && currentStatus === "documents_pending") {
			const updateResponse = await updateOrderStatus({
				orderId,
				status: "docs_analysis"
			})

			if (updateResponse.success) {
				revalidatePath("/dashboard/orders")
			} else {
				console.error(`Falha ao atualizar status do pedido ${orderId}: ${updateResponse.message}`)
			}
		}

		return {
			success: true,
			message: "Status dos documentos verificado com sucesso.",
			data: documentStatus
		}
	} catch (e) {
		console.error("Erro inesperado em checkOrderDocumentsStatus:", e)
		const errorMessage = e instanceof Error ? e.message : "Ocorreu um erro desconhecido."
		return {
			success: false,
			message: `Ocorreu um erro inesperado no servidor: ${errorMessage}`
		}
	}
}

export default checkOrderDocumentsStatus
