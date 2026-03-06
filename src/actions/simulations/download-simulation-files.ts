"use server"

import JSZip from "jszip"

import { createAdminClient } from "@/lib/supabase/admin"
import type { ActionResponse } from "@/types/action-response"
import type { documentFields } from "@/lib/constants"

const BUCKET_NAME = "docs_simulation"

type DocumentFieldName = (typeof documentFields)[number]["name"]

interface DownloadFilesParams {
	simulationId: string
	documentNames: DocumentFieldName[]
	customerId: string
}

type DownloadFilesResponse = {
	fileName: string
	fileBase64: string
	contentType: string
}

async function downloadSimulationFiles({ simulationId, documentNames, customerId }: DownloadFilesParams): Promise<ActionResponse<DownloadFilesResponse>> {
	if (!simulationId) {
		return { success: false, message: "ID da simulação não fornecido." }
	}
	if (!documentNames || documentNames.length === 0) {
		return { success: false, message: "Nenhum documento selecionado para download." }
	}

	const supabase = createAdminClient()

	try {
		const { data, error } = await supabase.from("customers").select("company_name").eq("id", customerId).single()

		if (error) throw error

		if (documentNames.length === 1) {
			// Caso de arquivo único
			const docName = documentNames[0]
			const filePath = `${simulationId}/${docName}`

			const { data: fileBlob, error } = await supabase.storage.from(BUCKET_NAME).download(filePath)

			if (error) {
				console.error(`Erro ao baixar o arquivo ${docName}:`, error)
				return { success: false, message: `Não foi possível baixar o documento: ${docName}.` }
			}

			const fileBuffer = await fileBlob.arrayBuffer()
			const fileBase64 = Buffer.from(fileBuffer).toString("base64")

			return {
				success: true,
				message: "Arquivo pronto para download.",
				data: {
					fileName: data?.company_name ? `${data.company_name.toLocaleLowerCase().replace(/ /g, "_")}_${docName}.pdf` : `${docName}.pdf`,
					fileBase64,
					contentType: "application/pdf"
				}
			}
		}

		// Caso de múltiplos arquivos (ZIP)
		const zip = new JSZip()
		for (const docName of documentNames) {
			const filePath = `${simulationId}/${docName}`
			const { data: fileBlob, error } = await supabase.storage.from(BUCKET_NAME).download(filePath)

			if (error) {
				console.warn(`Arquivo ${docName} não encontrado para a simulação ${simulationId}, pulando.`)
				continue // Pula para o próximo arquivo se este não for encontrado
			}

			const fileBuffer = await fileBlob.arrayBuffer()
			zip.file(`${docName}.pdf`, fileBuffer)
		}

		if (Object.keys(zip.files).length === 0) {
			return { success: false, message: "Nenhum dos documentos selecionados foi encontrado para download." }
		}

		const zipBase64 = await zip.generateAsync({ type: "base64" })
		return {
			success: true,
			message: "Arquivos compactados com sucesso.",
			data: {
				fileName: data?.company_name
					? `documentos_${data.company_name.toLocaleLowerCase().replace(/ /g, "_")}.zip`
					: `documentos_simulacao_${simulationId}.zip`,
				fileBase64: zipBase64,
				contentType: "application/zip"
			}
		}
	} catch (e) {
		console.error("Erro inesperado em downloadSimulationFiles:", e)
		const errorMessage = e instanceof Error ? e.message : "Ocorreu um erro desconhecido."
		return {
			success: false,
			message: `Ocorreu um erro inesperado no servidor: ${errorMessage}`
		}
	}
}

export default downloadSimulationFiles
