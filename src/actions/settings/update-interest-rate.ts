"use server"

import { revalidatePath } from "next/cache"

import { createAdminClient } from "@/lib/supabase/admin"
import type { ActionResponse } from "@/types/action-response"

interface UpdateRateParams {
	rateId: "service_fee_36" | "service_fee_48" | "service_fee_60" | "interest_rate_36" | "interest_rate_48" | "interest_rate_60"
	value: number
}

async function updateRate({ rateId, value }: UpdateRateParams): Promise<ActionResponse<null>> {
	try {
		const supabase = createAdminClient()
		const { error } = await supabase.from("rates").update({ value, updated_at: new Date().toISOString() }).eq("id", rateId)

		if (error) {
			console.error(`Error updating ${rateId}:`, error)
			return { success: false, message: `Não foi possível atualizar a taxa "${rateId}".` }
		}

		revalidatePath("/dashboard/admin/settings")
		return { success: true, message: "Taxa atualizada com sucesso!", data: null }
	} catch (e) {
		console.error(`Unexpected error in updateRate for ${rateId}:`, e)
		return { success: false, message: "Ocorreu um erro inesperado." }
	}
}

export default updateRate
