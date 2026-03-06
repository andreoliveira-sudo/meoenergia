"use server"

import { PostgrestError } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

import type { StructureType } from "@/lib/definitions/equipments"
import { createClient } from "@/lib/supabase/server"
import type { ActionResponse } from "@/types/action-response"

async function createStructureType(name: string): Promise<ActionResponse<StructureType>> {
	if (!name || name.trim().length === 0) {
		return { success: false, message: "O nome não pode estar vazio." }
	}

	try {
		const supabase = await createClient()

		// Check if it already exists to provide a better error message
		const { data: existing } = await supabase.from("structure_types").select("id").eq("name", name.trim()).maybeSingle()

		if (existing) {
			return { success: false, message: "Este tipo de estrutura já existe." }
		}

		const { data, error } = await supabase.from("structure_types").insert({ name: name.trim() }).select().single()

		if (error) {
			console.error("Erro ao criar tipo de estrutura (Supabase):", error)
			if (error instanceof PostgrestError && error.code === "23505") {
				// Unique violation
				return { success: false, message: "Este tipo de estrutura já existe." }
			}
			return {
				success: false,
				message: "Erro ao criar o tipo de estrutura. Por favor, tente novamente."
			}
		}

		// Revalidate the path to show the new data in the table
		revalidatePath("/dashboard/admin/data")

		return {
			success: true,
			message: "Tipo de estrutura criado com sucesso!",
			data
		}
	} catch (e) {
		console.error("Erro inesperado em createStructureType:", e)
		const errorMessage = e instanceof Error ? e.message : "Ocorreu um erro desconhecido."
		return {
			success: false,
			message: `Ocorreu um erro inesperado: ${errorMessage}`
		}
	}
}

export default createStructureType
