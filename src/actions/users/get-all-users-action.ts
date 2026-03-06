"use server"

import { createClient } from "@/lib/supabase/server"
import type { ActionResponse } from "@/types/action-response"

type UserSummary = {
	id: string
	name: string
	email: string
}

export default async function getAllUsersAction(): Promise<ActionResponse<UserSummary[]>> {
	try {
		const supabase = await createClient()

		const { data, error } = await supabase.from("users").select("id, name, email").order("name", { ascending: true })

		if (error) {
			return {
				success: false,
				message: error.message
			}
		}

		return {
			success: true,
			message: "Usuarios carregados com sucesso",
			data: data ?? []
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : "Erro ao carregar usuarios"
		return {
			success: false,
			message
		}
	}
}
