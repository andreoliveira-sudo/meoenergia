"use server"

import { PostgrestError } from "@supabase/supabase-js"

import { createAdminClient } from "@/lib/supabase/admin"
import type { ActionResponse } from "@/types/action-response"

async function deleteBrand(brandId: string): Promise<ActionResponse<{ brandId: string }>> {
	if (!brandId) {
		return { success: false, message: "ID da marca não fornecido." }
	}

	const supabase = createAdminClient()

	try {
		const { error } = await supabase.from("equipment_brands").delete().eq("id", brandId)

		if (error) {
			console.error("Erro ao deletar marca (Supabase):", error)

			if (error.code === "23503") {
				// Foreign key violation
				return {
					success: false,
					message: "Não é possível deletar esta marca, pois ela está associada a um ou mais equipamentos."
				}
			}

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
