"use server"

import type { GroupRuleType } from "@/lib/definitions/groups"
import { createClient } from "@/lib/supabase/server"
import type { ActionResponse } from "@/types/action-response"

type PartnerSummary = {
	id: string
	legal_business_name: string | null
}

export type GroupRuleWithPartner = {
	id: string
	group_id: string | null
	rule_type: GroupRuleType
	created_at: string
	partner: PartnerSummary | null
}

export default async function getGroupRulesAction(groupId: string): Promise<ActionResponse<GroupRuleWithPartner[]>> {
	try {
		const supabase = await createClient()

		const { data, error } = await supabase
			.from("group_rules")
			.select(
				`
					id,
					group_id,
					rule_type,
					created_at,
					partners:target_id (
						id,
						legal_business_name
					)
				`
			)
			.eq("group_id", groupId)
			.order("created_at", { ascending: false })

		if (error) {
			return {
				success: false,
				message: error.message
			}
		}

		const normalizedRules =
			data?.map((rule) => ({
				id: rule.id,
				group_id: rule.group_id,
				rule_type: rule.rule_type as GroupRuleType,
				created_at: rule.created_at,
				partner: rule.partners ?? null
			})) ?? []

		return {
			success: true,
			message: "Regras carregadas com sucesso",
			data: normalizedRules
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : "Erro ao buscar regras do grupo"
		return {
			success: false,
			message
		}
	}
}
