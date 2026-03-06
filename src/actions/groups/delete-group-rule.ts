"use server"

import type { GroupRule } from "@/lib/definitions/groups"
import { createClient } from "@/lib/supabase/server"
import type { ActionResponse } from "@/types/action-response"

export default async function deleteGroupRuleAction(ruleId: string): Promise<ActionResponse<GroupRule>> {
	try {
		const supabase = await createClient()

		const { data, error } = await supabase.from("group_rules").delete().eq("id", ruleId).select("id, entity, rule_type, target_id, created_at").single()

		if (error || !data) {
			return {
				success: false,
				message: error?.message ?? "Nao foi possivel remover a regra do grupo"
			}
		}

		return {
			success: true,
			message: "Regra removida com sucesso",
			data: data as GroupRule
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : "Erro ao remover regra do grupo"
		return {
			success: false,
			message
		}
	}
}
