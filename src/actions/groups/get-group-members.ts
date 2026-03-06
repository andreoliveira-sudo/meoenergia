"use server"

import { createClient } from "@/lib/supabase/server"
import type { ActionResponse } from "@/types/action-response"

type GroupMember = {
	user_id: string
	name: string
	email: string
	role: string | null
}

type GroupMemberQueryResult = {
	user_id: string
	role: string | null
	users: {
		name: string
		email: string
	} | null
}

export default async function getGroupMembersAction(groupId: string): Promise<ActionResponse<GroupMember[]>> {
	try {
		const supabase = await createClient()

		const { data, error } = await supabase
			.from("group_members")
			.select(
				`
				user_id,
				role,
				users (
					name,
					email
				)
				`
			)
			.eq("group_id", groupId)

		if (error) {
			return {
				success: false,
				message: error.message
			}
		}

		const membersData = (data as GroupMemberQueryResult[] | null) ?? []

		const members = membersData.map((item) => ({
				user_id: item.user_id,
				name: item.users?.name ?? "",
				email: item.users?.email ?? "",
				role: item.role ?? null
			}))

		return {
			success: true,
			message: "Membros carregados com sucesso",
			data: members
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : "Erro ao buscar membros do grupo"
		return {
			success: false,
			message
		}
	}
}
