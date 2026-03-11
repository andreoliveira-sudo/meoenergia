"use server"

import { PostgrestError } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

import { createAdminClient } from "@/lib/supabase/admin"
import type { ActionResponse } from "@/types/action-response"

interface DeleteSimulationParams {
	simulationId: string
}

async function deleteSimulation({ simulationId }: DeleteSimulationParams): Promise<ActionResponse<null>> {
	if (!simulationId) {
		return { success: false, message: "ID da Simulação não fornecido." }
	}

	const supabase = createAdminClient()

	try {
		const { error } = await supabase
			.from("simulations")
			.update({ deleted_at: new Date().toISOString() })
			.eq("id", simulationId)
			.is("deleted_at", null)

		if (error) {
			console.error("Erro ao deletar simulação (Supabase):", error)
			throw error
		}

		revalidatePath("/dashboard/simulations")

		return {
			success: true,
			data: null,
			message: "Simulação foi deletada com sucesso."
		}
	} catch (error) {
		console.error("Erro inesperado em deleteSimulation:", error)
		if (error instanceof PostgrestError) {
			return { success: false, message: `Erro no banco de dados: ${error.message}` }
		}
		return { success: false, message: "Ocorreu um erro inesperado. Tente novamente." }
	}
}

export default deleteSimulation
