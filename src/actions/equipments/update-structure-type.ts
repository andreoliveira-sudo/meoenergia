"use server"

import { PostgrestError } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

import { createAdminClient } from "@/lib/supabase/admin"
import { addStructureTypeSchema, type AddStructureTypeData } from "@/lib/validations/structure-type"
import type { ActionResponse } from "@/types/action-response"

interface UpdateStructureTypeParams {
	structureTypeId: string
	data: AddStructureTypeData
}

async function updateStructureType({ structureTypeId, data }: UpdateStructureTypeParams): Promise<ActionResponse<{ structureTypeId: string }>> {
	if (!structureTypeId) {
		return { success: false, message: "ID do tipo de estrutura não fornecido." }
	}

	const validation = addStructureTypeSchema.safeParse(data)
	if (!validation.success) {
		const issues = validation.error.issues.map((issue) => issue.message).join(", ")
		return { success: false, message: `Dados inválidos: ${issues}` }
	}

	const supabase = createAdminClient()

	try {
		const { error } = await supabase.from("structure_types").update({ name: validation.data.name }).eq("id", structureTypeId)

		if (error) {
			console.error("Erro ao atualizar o tipo de estrutura (Supabase):", error)

			if (error instanceof PostgrestError && error.code === "23505") {
				// Unique constraint violation
				return {
					success: false,
					message: "Já existe um tipo de estrutura com este nome."
				}
			}
			return { success: false, message: "Erro ao atualizar o tipo de estrutura. Por favor, tente novamente." }
		}

		revalidatePath("/dashboard/admin/data")
		return {
			success: true,
			message: "Tipo de estrutura atualizado com sucesso.",
			data: { structureTypeId }
		}
	} catch (e) {
		console.error("Erro inesperado em updateStructureType:", e)
		const errorMessage = e instanceof Error ? e.message : "Ocorreu um erro desconhecido."
		return {
			success: false,
			message: `Ocorreu um erro inesperado no servidor: ${errorMessage}`
		}
	}
}

export default updateStructureType
