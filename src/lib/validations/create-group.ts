import { z } from "zod"

export const createGroupSchema = z.object({
	name: z.string().min(2, "O nome é obrigatório"),
	description: z.string().optional()
})

export type CreateGroupSchema = z.infer<typeof createGroupSchema>
