import { z } from "zod"

const addBrandSchema = z.object({
	name: z.string().toUpperCase().min(2, "O nome deve ter no mínimo 2 caracteres.").max(50, "O nome não pode ter mais de 50 caracteres.")
})

type AddBrandData = z.infer<typeof addBrandSchema>

export { addBrandSchema }
export type { AddBrandData }
