import type { Tables } from "@/lib/definitions/supabase"

export type GroupRuleEntity = "partners" | "sellers" | "customers" | "simulations"
export type GroupRuleType = "include" | "exclude"

export type GroupRule = Pick<Tables<"group_rules">, "id" | "entity" | "rule_type" | "target_id" | "created_at"> & {
	entity: GroupRuleEntity
	rule_type: GroupRuleType
}
