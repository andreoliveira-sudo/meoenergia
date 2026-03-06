import type { GroupRuleType } from "@/lib/definitions/groups"

export type GroupMemberRow = {
	user_id: string
	name: string
	email: string
	role: string | null
	groupId: string
}

export type GroupRuleRow = {
	id: string
	rule_type: GroupRuleType
	created_at: string
	groupId: string
	partnerId: string | null
	partnerName: string
}
