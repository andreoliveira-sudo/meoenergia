"use server"

import { PostgrestError } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

import { createAdminClient } from "@/lib/supabase/admin"
import { addBrandSchema, type AddBrandData } from "@/lib/validations/brand"
import type { ActionResponse } from "@/types/action-response"

interface UpdateBrandParams {
	brandId: string
	data: AddBrandData
}

async function updateBrand({ brandId, data }: UpdateBrandParams): Promise<ActionResponse<{ brandId: string }>> {
	if (!brandId) {
		return { success: false, message: "ID da marca não fornecido." }
	}

	const validation = addBrandSchema.safeParse(data)
	if (!validation.success) {
		const issues = validation.error.issues.map((issue) => issue.message).join(", ")
		return { success: false, message: `Dados inválidos: ${issues}` }
	}

	const supabase = createAdminClient()

	try {
		const { error } = await supabase.from("equipment_brands").update({ name: validation.data.name }).eq("id", brandId)

		if (error) {
			console.error("Erro ao atualizar marca (Supabase):", error)

			if (error instanceof PostgrestError && error.code === "23505") {
				// Unique constraint violation
				return {
					success: false,
					message: "Já existe uma marca com este nome."
				}
			}
			return { success: false, message: "Erro ao atualizar a marca. Por favor, tente novamente." }
		}

		revalidatePath("/dashboard/admin/data")
		return {
			success: true,
			message: "Marca atualizada com sucesso.",
			data: { brandId }
		}
	} catch (e) {
		console.error("Erro inesperado em updateBrand:", e)
		const errorMessage = e instanceof Error ? e.message : "Ocorreu um erro desconhecido."
		return {
			success: false,
			message: `Ocorreu um erro inesperado no servidor: ${errorMessage}`
		}
	}
}

export default updateBrand
