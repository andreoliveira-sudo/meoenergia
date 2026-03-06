// src/actions/orders/upload-order-files.ts
"use server"

import { documentFields } from "@/lib/constants"
import { createAdminClient } from "@/lib/supabase/admin"
import type { ActionResponse } from "@/types/action-response"

const BUCKET_NAME = "docs_simulation"

export default async function uploadOrderFiles(
	orderId: string,
	formData: FormData
): Promise<ActionResponse<{ paths: string[]; uploadedCount: number }>> {
	const supabase = createAdminClient()
	const uploadedPaths: string[] = []
	let uploadedCount = 0

	try {
		for (const field of documentFields) {
			const fieldName = field.name
			const file = formData.get(fieldName)

			// Valida se é um arquivo (tem o método arrayBuffer, característico de File/Blob)
			if (file && typeof (file as File).arrayBuffer === "function") {
				const fileObj = file as File
				const filePath = `${orderId}/${fieldName}`

				const { error } = await supabase.storage.from(BUCKET_NAME).upload(filePath, fileObj, {
					contentType: fileObj.type || "application/octet-stream",
					upsert: true
				})

				if (error) {
					// Se um upload falhar, tenta remover os que já foram enviados para manter a consistência
					for (const uploadedPath of uploadedPaths) {
						await supabase.storage.from(BUCKET_NAME).remove([uploadedPath])
					}
					console.error(`Erro ao fazer upload do arquivo ${fieldName}:`, error)
					return { success: false, message: `Erro ao enviar o arquivo para ${fieldName}.` }
				}
				uploadedPaths.push(filePath)
				uploadedCount++
			}
		}

		return {
			success: true,
			message: "Arquivos enviados com sucesso.",
			data: { paths: uploadedPaths, uploadedCount }
		}
	} catch (e) {
		console.error("Erro inesperado em uploadOrderFiles:", e)
		// Tenta remover os arquivos já enviados
		if (uploadedPaths.length > 0) {
			await supabase.storage.from(BUCKET_NAME).remove(uploadedPaths)
		}
		const errorMessage = e instanceof Error ? e.message : "Ocorreu um erro desconhecido."
		return {
			success: false,
			message: `Ocorreu um erro inesperado no servidor: ${errorMessage}`
		}
	}
}
