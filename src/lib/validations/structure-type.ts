import { z } from "zod"

const addStructureTypeSchema = z.object({
	name: z.string().min(3, "O nome deve ter no mínimo 3 caracteres.").max(50, "O nome não pode ter mais de 50 caracteres.")
})

type AddStructureTypeData = z.infer<typeof addStructureTypeSchema>

export { addStructureTypeSchema }
export type { AddStructureTypeData }
