"use server"

import { createClient } from "@/lib/supabase/server"
import type { ActionResponse } from "@/types/action-response"

type RemoveGroupMemberParams = {
	groupId: string
	userId: string
}

type RemovedGroupMember = {
	group_id: string
	user_id: string
	role: string | null
}

export default async function removeGroupMemberAction({
	groupId,
	userId
}: RemoveGroupMemberParams): Promise<ActionResponse<RemovedGroupMember>> {
	try {
		const supabase = await createClient()

		const { data, error } = await supabase
			.from("group_members")
			.delete()
			.eq("group_id", groupId)
			.eq("user_id", userId)
			.select("group_id, user_id, role")
			.single()

		if (error || !data) {
			return {
				success: false,
				message: error?.message ?? "Nao foi possivel remover o membro do grupo"
			}
		}

		return {
			success: true,
			message: "Membro removido com sucesso",
			data
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : "Erro ao remover membro do grupo"
		return {
			success: false,
			message
		}
	}
}
