"use server"

import { revalidatePath } from "next/cache"

import { createAdminClient } from "@/lib/supabase/admin"
import type { ActionResponse } from "@/types/action-response"

async function deleteEquipment(equipmentId: number): Promise<ActionResponse<{ equipmentId: number }>> {
	if (!equipmentId) {
		return { success: false, message: "ID do equipamento não fornecido." }
	}

	const supabase = createAdminClient()

	try {
		const { error } = await supabase.from("equipments").delete().eq("id", equipmentId)

		if (error) {
			console.error("Erro ao deletar equipamento (Supabase):", error)

			if (error.code === "23503") {
				// Foreign key violation
				return {
					success: false,
					message: "Não é possível deletar este equipamento, pois ele está associado a uma ou mais simulações ou pedidos."
				}
			}

			return {
				success: false,
				message: "Erro ao deletar o equipamento. Por favor, tente novamente."
			}
		}

		revalidatePath("/dashboard/admin/data")
		return {
			success: true,
			message: "Equipamento deletado com sucesso.",
			data: { equipmentId }
		}
	} catch (e) {
		console.error("Erro inesperado em deleteEquipment:", e)
		const errorMessage = e instanceof Error ? e.message : "Ocorreu um erro desconhecido."
		return {
			success: false,
			message: `Ocorreu um erro inesperado no servidor: ${errorMessage}`
		}
	}
}

export default deleteEquipment
