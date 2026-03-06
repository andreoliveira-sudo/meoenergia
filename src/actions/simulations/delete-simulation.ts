"use server"

import { PostgrestError } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import type { ActionResponse } from "@/types/action-response"

interface DeleteSimulationParams {
	simulationId: string
}

async function deleteSimulation({ simulationId }: DeleteSimulationParams): Promise<ActionResponse<null>> {
	if (!simulationId) {
		return { success: false, message: "ID da Simulação não fornecido." }
	}

	const supabase = await createClient()

	try {
		// 1. Deletar a simulação
		// A deleção em cascata (ON DELETE CASCADE) na FK de customer_id cuidaria disso,
		// mas fazer em dois passos nos dá mais controle sobre a resposta.
		const { error: simulationError } = await supabase.from("simulations").delete().eq("id", simulationId)

		if (simulationError) {
			console.error("Erro ao deletar simulação (Supabase):", simulationError)
			throw simulationError
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
