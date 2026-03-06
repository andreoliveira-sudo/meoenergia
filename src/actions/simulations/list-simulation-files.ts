"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import type { ActionResponse } from "@/types/action-response"

const BUCKET_NAME = "docs_simulation"

async function listSimulationFiles(simulationId: string): Promise<ActionResponse<{ name: string }[]>> {
	if (!simulationId) {
		return { success: false, message: "ID da simulação não fornecido." }
	}

	const supabase = createAdminClient()

	try {
		const { data, error } = await supabase.storage.from(BUCKET_NAME).list(simulationId)

		if (error) {
			console.error(`Erro ao listar arquivos da simulação ${simulationId}:`, error)
			return { success: false, message: "Não foi possível buscar a lista de arquivos." }
		}

		return {
			success: true,
			message: "Arquivos encontrados.",
			data: data.map((file) => ({ name: file.name }))
		}
	} catch (e) {
		console.error("Erro inesperado em listSimulationFiles:", e)
		const errorMessage = e instanceof Error ? e.message : "Ocorreu um erro desconhecido."
		return {
			success: false,
			message: `Ocorreu um erro inesperado no servidor: ${errorMessage}`
		}
	}
}

export default listSimulationFiles
