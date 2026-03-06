import { z } from "zod"

export const createRuleSchema = z.object({
	rule_type: z.enum(["include", "exclude"]),
	target_id: z.string().min(1, "Selecione um parceiro")
})

export type CreateRuleSchema = z.infer<typeof createRuleSchema>
