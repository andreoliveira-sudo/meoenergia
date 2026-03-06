"use server"

import { PostgrestError } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

import { createAdminClient } from "@/lib/supabase/admin"
import type { ActionResponse } from "@/types/action-response"
import type { AddEquipmentData } from "@/lib/validations/equipment"

interface UpdateEquipmentParams {
	equipmentId: number
	data: AddEquipmentData
}

async function updateEquipment({ equipmentId, data }: UpdateEquipmentParams): Promise<ActionResponse<{ equipmentId: number }>> {
	if (!equipmentId) {
		return { success: false, message: "ID do equipamento não fornecido." }
	}

	const supabase = createAdminClient()

	try {
		const { error } = await supabase.from("equipments").update(data).eq("id", equipmentId)

		if (error) {
			console.error("Erro ao atualizar equipamento (Supabase):", error)

			if (error instanceof PostgrestError && error.code === "23505") {
				// Unique constraint violation (e.g., if you had a unique name constraint)
				return {
					success: false,
					message: "Já existe um equipamento com estes dados."
				}
			}
			return { success: false, message: "Erro ao atualizar o equipamento. Por favor, tente novamente." }
		}

		revalidatePath("/dashboard/admin/data")
		return {
			success: true,
			message: "Equipamento atualizado com sucesso.",
			data: { equipmentId }
		}
	} catch (e) {
		console.error("Erro inesperado em updateEquipment:", e)
		const errorMessage = e instanceof Error ? e.message : "Ocorreu um erro desconhecido."
		return {
			success: false,
			message: `Ocorreu um erro inesperado no servidor: ${errorMessage}`
		}
	}
}

export default updateEquipment
