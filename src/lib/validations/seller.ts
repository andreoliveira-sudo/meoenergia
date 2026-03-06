import { z } from "zod"

const registerSellerSchema = z
	.object({
		// Step 1: Dados Pessoais
		name: z.string().min(3, { message: "O nome deve ter no mínimo 3 caracteres." }),
		cpf: z
			.string()
			.length(14, { message: "CPF deve conter 11 dígitos. Formato: 000.000.000-00" })
			.transform((val) => val.replace(/\D/g, "")),
		phone: z
			.string()
			.refine((val) => val.length === 14 || val.length === 15, { message: "Celular inválido. Use (00) 00000-0000 ou (00) 0000-0000" })
			.transform((val) => val.replace(/\D/g, "")),

		// Step 2: Endereço
		cep: z
			.string()
			.length(9, { message: "CEP deve conter 8 dígitos. Formato: 00000-000" })
			.transform((val) => val.replace(/\D/g, "")),
		street: z.string().min(1, { message: "Rua é obrigatória." }),
		number: z.string().min(1, { message: "Número é obrigatório." }),
		complement: z.string().optional(),
		neighborhood: z.string().min(1, { message: "Bairro é obrigatório." }),
		city: z.string().min(1, { message: "Cidade é obrigatória." }),
		state: z.string().length(2, { message: "Estado deve ter 2 caracteres." }),

		// Step 3: Acesso
		email: z.email({ message: "Por favor, insira um email válido." }),
		confirmEmail: z.email({ message: "Por favor, insira um email válido para confirmação." }),
		password: z.string().min(8, { message: "A senha deve ter no mínimo 8 caracteres." }),
		confirmPassword: z.string().min(8, { message: "A confirmação de senha deve ter no mínimo 8 caracteres." })
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "As senhas não coincidem.",
		path: ["confirmPassword"]
	})
	.refine((data) => data.email === data.confirmEmail, {
		message: "Os emails não coincidem.",
		path: ["confirmEmail"]
	})

type RegisterSellerData = z.infer<typeof registerSellerSchema>

const editSellerSchema = z.object({
	// Step 1: Dados Pessoais
	name: z.string().min(3, { message: "O nome deve ter no mínimo 3 caracteres." }),
	cpf: z
		.string()
		.length(14, { message: "CPF deve conter 11 dígitos. Formato: 000.000.000-00" })
		.transform((val) => val.replace(/\D/g, "")),
	phone: z
		.string()
		.refine((val) => val.length === 14 || val.length === 15, { message: "Celular inválido. Use (00) 00000-0000 ou (00) 0000-0000" })
		.transform((val) => val.replace(/\D/g, "")),

	// Step 2: Endereço
	cep: z
		.string()
		.length(9, { message: "CEP deve conter 8 dígitos. Formato: 00000-000" })
		.transform((val) => val.replace(/\D/g, "")),
	street: z.string().min(1, { message: "Rua é obrigatória." }),
	number: z.string().min(1, { message: "Número é obrigatório." }),
	complement: z.string().optional(),
	neighborhood: z.string().min(1, { message: "Bairro é obrigatório." }),
	city: z.string().min(1, { message: "Cidade é obrigatória." }),
	state: z.string().length(2, { message: "Estado deve ter 2 caracteres." })
})

type EditSellerData = z.infer<typeof editSellerSchema>

export { registerSellerSchema, editSellerSchema }
export type { RegisterSellerData, EditSellerData }
