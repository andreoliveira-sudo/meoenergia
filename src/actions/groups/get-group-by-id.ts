"use server"

import { createClient } from "@/lib/supabase/server"

export default async function getGroupById(groupId: string) {
	const supabase = await createClient()

	const { data, error } = await supabase
		.from("groups")
		.select(`
			id,
			name,
			description,
			created_at,
			members_count: group_members(count),
			rules_count: group_rules(count)
		`)
		.eq("id", groupId)
		.single()

	if (error) {
		console.error("Erro ao buscar grupo:", error)
		return null
	}

	return {
		...data,
		members_count: data.members_count?.[0]?.count ?? 0,
		rules_count: data.rules_count?.[0]?.count ?? 0
	}
}
