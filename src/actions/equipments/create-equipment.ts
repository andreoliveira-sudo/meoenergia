"use server"

import { PostgrestError } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import type { Equipment } from "@/lib/definitions/equipments"
import { createClient } from "@/lib/supabase/server"
import type { AddEquipmentData } from "@/lib/validations/equipment"
import type { ActionResponse } from "@/types/action-response"

async function createEquipment(data: AddEquipmentData): Promise<ActionResponse<Equipment>> {
	try {
		const supabase = await createClient()

		const { data: newEquipment, error } = await supabase
			.from("equipments")
			.insert({
				name: data.name,
				type_id: data.type_id,
				brand_id: data.brand_id === "" ? undefined : data.brand_id
			})
			.select()
			.single()

		if (error) {
			console.error("Erro ao criar equipamento (Supabase):", error)
			if (error instanceof PostgrestError && error.code === "23505") {
				return { success: false, message: "Já existe um equipamento com este nome, tipo e marca." }
			}
			return {
				success: false,
				message: "Erro ao criar o equipamento. Por favor, tente novamente."
			}
		}

		revalidatePath("/admin/data")

		return {
			success: true,
			message: "Equipamento criado com sucesso!",
			data: newEquipment
		}
	} catch (e) {
		console.error("Erro inesperado em createEquipment:", e)
		const errorMessage = e instanceof Error ? e.message : "Ocorreu um erro desconhecido."
		return {
			success: false,
			message: `Ocorreu um erro inesperado: ${errorMessage}`
		}
	}
}

export default createEquipment
