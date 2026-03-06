import { z } from "zod"

export const createMemberSchema = z.object({
	user_id: z.string().min(1, "Selecione um usuario"),
	role: z.string().min(1, "Informe a funcao do membro")
})

export type CreateMemberSchema = z.infer<typeof createMemberSchema>
