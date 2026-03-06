import { z } from "zod"

export const updateUserSchema = z
	.object({
		name: z.string().min(3, "O nome deve ter no mínimo 3 caracteres."),
		email: z.string().email(),
		currentPassword: z.string().optional(),
		newPassword: z.string().optional(),
		confirmPassword: z.string().optional()
	})
	.refine(
		(data) => {
			// Se o usuário preencher a nova senha, os outros dois campos de senha se tornam obrigatórios
			if (data.newPassword) {
				return !!data.currentPassword && !!data.confirmPassword
			}
			return true
		},
		{
			message: "Para alterar a senha, você deve preencher a senha atual, a nova e a confirmação.",
			path: ["currentPassword"] // O erro pode ser mostrado no primeiro campo de senha
		}
	)
	.refine(
		(data) => {
			// Se a nova senha for preenchida, ela deve ser igual à confirmação
			if (data.newPassword) {
				return data.newPassword === data.confirmPassword
			}
			return true
		},
		{
			message: "As novas senhas não coincidem.",
			path: ["confirmPassword"]
		}
	)
	.refine(
		(data) => {
			// Se a nova senha for preenchida, ela deve ter no mínimo 8 caracteres
			if (data.newPassword) {
				return data.newPassword.length >= 8
			}
			return true
		},
		{
			message: "A nova senha deve ter no mínimo 8 caracteres.",
			path: ["newPassword"]
		}
	)

export type UpdateUserData = z.infer<typeof updateUserSchema>
