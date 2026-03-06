"use server"

import { PostgrestError } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

import type { SimulationStatus } from "@/lib/definitions/simulations"
import { createClient } from "@/lib/supabase/server"
import type { ActionResponse } from "@/types/action-response"

interface UpdateSimulationStatusParams {
	simulationId: string
	status: SimulationStatus
}

async function updateSimulationStatus({ simulationId, status }: UpdateSimulationStatusParams): Promise<ActionResponse<{ simulationId: string }>> {
	if (!simulationId) {
		return { success: false, message: "ID da simulação não fornecido." }
	}
	if (!status) {
		return { success: false, message: "Novo status não fornecido." }
	}

	const supabase = await createClient()

	try {
		const { error, count } = await supabase.from("simulations").update({ status }, { count: "exact" }).eq("id", simulationId)

		if (error) {
			console.error("Erro ao atualizar status da simulação (Supabase):", error)
			if (error instanceof PostgrestError) {
				return { success: false, message: `Erro no banco de dados: ${error.message}` }
			}
			return { success: false, message: "Ocorreu um erro ao tentar atualizar o status." }
		}

		if (count === 0) {
			return { success: false, message: "Nenhuma simulação encontrada com o ID fornecido." }
		}

		revalidatePath("/dashboard/simulations")

		return {
			success: true,
			message: "Status da simulação atualizado com sucesso!",
			data: { simulationId }
		}
	} catch (e) {
		console.error("Erro inesperado em updateSimulationStatus:", e)
		return { success: false, message: "Ocorreu um erro inesperado no servidor." }
	}
}

export default updateSimulationStatus
