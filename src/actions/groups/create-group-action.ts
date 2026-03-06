"use server"

import { createClient } from "@/lib/supabase/server"
import type { ActionResponse } from "@/types/action-response"

interface CreateGroupPayload {
	name: string
	description?: string
}

export default async function createGroupAction({ name, description }: CreateGroupPayload): Promise<ActionResponse<{ groupId: string }>> {
	try {
		const supabase = await createClient()

		const { data, error } = await supabase
			.from("groups")
			.insert({
				name,
				description: description ?? null
			})
			.select("id")
			.single()

		if (error || !data) {
			return {
				success: false,
				message: error?.message ?? "Nao foi possivel criar o grupo"
			}
		}

		return {
			success: true,
			message: "Grupo criado com sucesso",
			data: {
				groupId: data.id
			}
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : "Erro ao criar grupo"
		return {
			success: false,
			message
		}
	}
}
