import { z } from "zod"
import { OTHERS_TYPE_ID } from "@/lib/constants"

const addEquipmentSchema = z
	.object({
		name: z.string().min(3, "O nome deve ter no mínimo 3 caracteres.").max(100, "O nome não pode ter mais de 100 caracteres."),
		type_id: z.string().min(1, "Selecione um tipo de equipamento."),
		brand_id: z.string().optional()
	})
	.refine(
		(data) => {
			// Se o tipo não for 'Outros', a marca é obrigatória.
			if (data.type_id !== OTHERS_TYPE_ID) {
				return !!data.brand_id && data.brand_id.length > 0
			}
			return true
		},
		{
			error: "A marca é obrigatória para este tipo de equipamento.",
			path: ["brand_id"]
		}
	)

type AddEquipmentData = z.infer<typeof addEquipmentSchema>

export { addEquipmentSchema }
export type { AddEquipmentData }
