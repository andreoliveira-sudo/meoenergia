// src/actions/simulations/upload-simulation-files.ts
"use server"

import { documentFields } from "@/lib/constants"
import { createAdminClient } from "@/lib/supabase/admin"
import type { ActionResponse } from "@/types/action-response"

const BUCKET_NAME = "docs_simulation"

export default async function uploadSimulationFiles(
	simulationId: string,
	formData: FormData
): Promise<ActionResponse<{ paths: string[] }>> {
	const supabase = createAdminClient()
	const uploadedPaths: string[] = []

	try {
		for (const field of documentFields) {
			const fieldName = field.name
			const file = formData.get(fieldName)

			// Valida se é um arquivo (tem o método arrayBuffer, característico de File/Blob)
			if (file && typeof (file as File).arrayBuffer === "function") {
				const fileObj = file as File
				const filePath = `${simulationId}/${fieldName}`

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
			}
		}

		return {
			success: true,
			message: "Todos os arquivos foram enviados com sucesso.",
			data: { paths: uploadedPaths }
		}
	} catch (e) {
		console.error("Erro inesperado em uploadSimulationFiles:", e)
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
