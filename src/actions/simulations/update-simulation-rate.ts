"use server"

import { revalidatePath } from "next/cache"

import { createAdminClient } from "@/lib/supabase/admin"
import type { ActionResponse } from "@/types/action-response"

interface UpdateRateParams {
	rateId: "service_fee_36" | "service_fee_48" | "service_fee_60" | "interest_rate_36" | "interest_rate_48" | "interest_rate_60"
	value: number
	simulationId: string
}

async function updateSimulationRate({ rateId, value, simulationId }: UpdateRateParams): Promise<ActionResponse<null>> {
	try {
		console.log(`[UpdateRate] Starting update for simulation ${simulationId}. Field: ${rateId}, Value: ${value}`)

		const supabase = createAdminClient()
		const { error } = await supabase
			.from("simulations")
			.update({ [rateId]: value })
			.eq("id", simulationId)

		if (error) {
			console.error(`[UpdateRate] Error updating ${rateId} for simulation ${simulationId}:`, error)
			return { success: false, message: `Erro ao atualizar taxa: ${error.message || error.details || "Erro desconhecido"}` }
		}

		console.log(`[UpdateRate] Success updating ${rateId} for simulation ${simulationId}`)

		revalidatePath("/dashboard/admin/settings")
		revalidatePath("/dashboard/simulations")
		return { success: true, message: "Taxa atualizada com sucesso!", data: null }
	} catch (e) {
		console.error(`[UpdateRate] Unexpected error in updateSimulationRate for ${rateId}:`, e)
		return { success: false, message: "Ocorreu um erro inesperado." }
	}
}

export default updateSimulationRate
