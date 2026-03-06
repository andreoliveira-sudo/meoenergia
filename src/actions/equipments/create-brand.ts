"use server"

import { PostgrestError } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

import type { EquipmentBrand } from "@/lib/definitions/equipments"
import { createClient } from "@/lib/supabase/server"
import type { ActionResponse } from "@/types/action-response"

async function createBrand(name: string): Promise<ActionResponse<EquipmentBrand>> {
	if (!name || name.trim().length === 0) {
		return { success: false, message: "O nome não pode estar vazio." }
	}

	try {
		const supabase = await createClient()

		// Check if it already exists to provide a better error message
		const { data: existing } = await supabase.from("equipment_brands").select("id").eq("name", name.trim()).maybeSingle()

		if (existing) {
			return { success: false, message: "Esta marca já existe." }
		}

		const { data, error } = await supabase.from("equipment_brands").insert({ name: name.trim() }).select().single()

		if (error) {
			console.error("Erro ao criar marca (Supabase):", error)
			if (error instanceof PostgrestError && error.code === "23505") {
				// Unique violation
				return { success: false, message: "Esta marca já existe." }
			}
			return {
				success: false,
				message: "Erro ao criar a marca. Por favor, tente novamente."
			}
		}

		// Revalidate the path to show the new data in the table
		revalidatePath("/dashboard/admin/data")

		return {
			success: true,
			message: "Marca criada com sucesso!",
			data
		}
	} catch (e) {
		console.error("Erro inesperado em createBrand:", e)
		const errorMessage = e instanceof Error ? e.message : "Ocorreu um erro desconhecido."
		return {
			success: false,
			message: `Ocorreu um erro inesperado: ${errorMessage}`
		}
	}
}

export default createBrand
