import { z } from "zod"

const registerPartnerSchema = z
	.object({
		// Step 1
		cnpj: z
			.string()
			.min(1, "CNPJ é obrigatório.")
			.refine((value) => /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(value), "CNPJ inválido. Formato esperado: 00.000.000/0000-00")
			.transform((val) => val.replace(/\D/g, "")),
		legalBusinessName: z.string().min(2, { message: "Razão social deve ter no mínimo 2 caracteres." }),
		contactName: z.string().min(3, { message: "Nome do responsável deve ter no mínimo 3 caracteres." }),
		contactMobile: z
			.string()
			.refine((val) => val.length === 14 || val.length === 15, { message: "Celular inválido. Use (00) 00000-0000 ou (00) 0000-0000" })
			.transform((val) => val.replace(/\D/g, "")),
		// Step 2
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
		// Step 3
		contactEmail: z.email({ message: "Por favor, insira um email válido." }),
		confirmEmail: z.email({ message: "Por favor, insira um email válido para confirmação." }),
		password: z.string().min(8, { message: "A senha deve ter no mínimo 8 caracteres." }),
		confirmPassword: z.string().min(8, { message: "A confirmação de senha deve ter no mínimo 8 caracteres." })
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "As senhas não coincidem.",
		path: ["confirmPassword"]
	})
	.refine((data) => data.contactEmail === data.confirmEmail, {
		message: "Os emails não coincidem.",
		path: ["confirmEmail"]
	})

type RegisterPartnerData = z.infer<typeof registerPartnerSchema>

const editPartnerSchema = z.object({
	// Step 1
	contact_name: z.string().min(3, { message: "Nome do responsável deve ter no mínimo 3 caracteres." }),
	contact_mobile: z
		.string()
		.refine((val) => val.length === 14 || val.length === 15, { message: "Celular inválido. Use (00) 00000-0000 ou (00) 0000-0000" })
		.transform((val) => val.replace(/\D/g, "")),
	// Step 2
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

type EditPartnerData = z.infer<typeof editPartnerSchema>

export { registerPartnerSchema, editPartnerSchema }
export type { RegisterPartnerData, EditPartnerData }
