"use server"

import { revalidatePath } from "next/cache"

import { createAdminClient } from "@/lib/supabase/admin"
import type { ActionResponse } from "@/types/action-response"

async function deleteStructureType(structureTypeId: string): Promise<ActionResponse<{ structureTypeId: string }>> {
	if (!structureTypeId) {
		return { success: false, message: "ID do tipo de estrutura não fornecido." }
	}

	const supabase = createAdminClient()

	try {
		const { error } = await supabase.from("structure_types").delete().eq("id", structureTypeId)

		if (error) {
			console.error("Erro ao deletar tipo de estrutura (Supabase):", error)

			if (error.code === "23503") {
				// Foreign key violation
				return {
					success: false,
					message: "Não é possível deletar este tipo, pois ele está associado a uma ou mais simulações/pedidos."
				}
			}

			return {
				success: false,
				message: "Erro ao deletar o tipo de estrutura. Por favor, tente novamente."
			}
		}

		revalidatePath("/dashboard/admin/data")
		return {
			success: true,
			message: "Tipo de estrutura deletado com sucesso.",
			data: { structureTypeId }
		}
	} catch (e) {
		console.error("Erro inesperado em deleteStructureType:", e)
		const errorMessage = e instanceof Error ? e.message : "Ocorreu um erro desconhecido."
		return {
			success: false,
			message: `Ocorreu um erro inesperado no servidor: ${errorMessage}`
		}
	}
}

export default deleteStructureType
