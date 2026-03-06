import { z } from "zod"

// Schema para o formulário de criação de conta
const signUpSchema = z
	.object({
		name: z.string().min(3, "O nome deve ter no mínimo 3 caracteres."),
		email: z.email("Por favor, insira um email válido."),
		password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres."),
		confirmPassword: z.string(),
		role: z.enum(["partner", "client"], "Selecione um tipo de conta.")
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "As senhas não coincidem.",
		path: ["confirmPassword"] // Aponta o erro para o campo de confirmação de senha
	})

type SignUpData = z.infer<typeof signUpSchema>

export { signUpSchema }
export type { SignUpData }
