"use server"

import { createClient } from "@/lib/supabase/server"

export default async function getAllGroups() {
	try {
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
			.order("name", { ascending: true })

		if (error) {
			console.error("Erro ao buscar grupos:", error)
			return []
		}

		// 👇 transforma os arrays [{count: n}] em números simples
		const flattened =
			data?.map((g) => ({
				...g,
				members_count: g.members_count?.[0]?.count ?? 0,
				rules_count: g.rules_count?.[0]?.count ?? 0
			})) ?? []

		return flattened
	} catch (error) {
		console.error("Erro inesperado em getAllGroups:", error)
		return []
	}
}
