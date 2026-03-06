"use server"

import { createClient } from "@/lib/supabase/server"
import type { ActionResponse } from "@/types/action-response"

type AddGroupMemberParams = {
	groupId: string
	userId: string
	role: string | null
}

type AddedGroupMember = {
	group_id: string
	user_id: string
	role: string | null
}

export default async function addGroupMemberAction({
	groupId,
	userId,
	role
}: AddGroupMemberParams): Promise<ActionResponse<AddedGroupMember>> {
	try {
		const supabase = await createClient()

		const { data, error } = await supabase
			.from("group_members")
			.insert({
				group_id: groupId,
				user_id: userId,
				role
			})
			.select("group_id, user_id, role")
			.single()

		if (error || !data) {
			return {
				success: false,
				message: error?.message ?? "Nao foi possivel adicionar o membro ao grupo"
			}
		}

		return {
			success: true,
			message: "Membro adicionado com sucesso",
			data
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : "Erro ao adicionar membro ao grupo"
		return {
			success: false,
			message
		}
	}
}
