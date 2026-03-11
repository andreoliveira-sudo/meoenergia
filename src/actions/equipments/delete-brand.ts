"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import type { ActionResponse } from "@/types/action-response"

async function deleteBrand(brandId: string): Promise<ActionResponse<{ brandId: string }>> {
	if (!brandId) {
		return { success: false, message: "ID da marca não fornecido." }
	}

	const supabase = createAdminClient()

	try {
		const { error } = await supabase
			.from("equipment_brands")
			.update({ deleted_at: new Date().toISOString() })
			.eq("id", brandId)
			.is("deleted_at", null)

		if (error) {
			console.error("Erro ao deletar marca (Supabase):", error)
			return {
				success: false,
				message: "Erro ao deletar a marca. Por favor, tente novamente."
			}
		}

		return {
			success: true,
			message: "Marca deletada com sucesso.",
			data: { brandId }
		}
	} catch (e) {
		console.error("Erro inesperado em deleteBrand:", e)
		const errorMessage = e instanceof Error ? e.message : "Ocorreu um erro desconhecido."
		return {
			success: false,
			message: `Ocorreu um erro inesperado no servidor: ${errorMessage}`
		}
	}
}

export default deleteBrand
