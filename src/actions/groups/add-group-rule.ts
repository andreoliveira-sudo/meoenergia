"use server"

import { createClient } from "@/lib/supabase/server"
import type { ActionResponse } from "@/types/action-response"
import type { Tables } from "@/lib/definitions/supabase"

type AddGroupRuleParams = {
	groupId: string
	entity: string
	rule_type: string
	target_id: string
}

type GroupRule = Pick<Tables<"group_rules">, "id" | "entity" | "rule_type" | "target_id" | "created_at">

export default async function addGroupRuleAction({
	groupId,
	entity,
	rule_type,
	target_id
}: AddGroupRuleParams): Promise<ActionResponse<GroupRule>> {
	try {
		const supabase = await createClient()

		const { data, error } = await supabase
			.from("group_rules")
			.insert({
				group_id: groupId,
				entity,
				rule_type,
				target_id
			})
			.select("id, entity, rule_type, target_id, created_at")
			.single()

		if (error || !data) {
			return {
				success: false,
				message: error?.message ?? "Nao foi possivel criar a regra do grupo"
			}
		}

		return {
			success: true,
			message: "Regra criada com sucesso",
			data
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : "Erro ao criar regra do grupo"
		return {
			success: false,
			message
		}
	}
}
