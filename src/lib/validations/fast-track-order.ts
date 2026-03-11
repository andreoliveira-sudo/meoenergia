import { z } from "zod"
import { isValidCpf, isValidCnpj } from "@/lib/utils"

const addressSchema = {
	postal_code: z.string().min(9, "CEP obrigatório"),
	street: z.string().min(1, "Rua obrigatória"),
	neighborhood: z.string().min(1, "Bairro obrigatório"),
	city: z.string().min(1, "Cidade obrigatória"),
	state: z.string().length(2, "UF inválido"),
	number: z.string().min(1, "Número obrigatório"),
}

const financialTechnicalSchema = {
	current_consumption: z.coerce.number().min(1, "Consumo obrigatório"),
	monthly_bill_value: z.coerce.number().min(1, "Valor da conta obrigatório"),
	system_power: z.coerce.number().min(0.1, "Potência obrigatória"),
	equipment_value: z.coerce.number().min(1, "Valor do Kit obrigatório"),
	labor_value: z.coerce.number().min(1, "Valor mão de obra obrigatório"),
	payment_day: z.coerce.number()
		.refine(val => [5, 15, 20, 30].includes(val), "Dia de pagamento inválido"),
	financing_term: z.coerce.number()
		.min(24, "Prazo mínimo de 24 meses")
		.max(96, "Prazo máximo de 96 meses"),
}

const contactSchema = {
	email: z.string().email("Email inválido"),
	phone: z.string()
		.min(14, "Celular inválido. Use formato (00) 00000-0000")
		.refine(
			(val) => {
				const digits = val.replace(/\D/g, "")
				return digits.length === 10 || digits.length === 11
			},
			"Celular deve ter 10 ou 11 dígitos"
		),
}

export const quickOrderPFSchema = z.object({
	cpf: z.string()
		.min(14, "CPF inválido. Use formato 000.000.000-00")
		.refine((val) => {
			const digits = val.replace(/\D/g, "")
			return digits.length === 11
		}, "CPF deve ter 11 dígitos")
		.refine(isValidCpf, "CPF inválido"),
	name: z.string()
		.min(3, "Nome completo deve ter no mínimo 3 caracteres")
		.max(255, "Nome muito longo"),
	...contactSchema,
	...addressSchema,
	...financialTechnicalSchema,
})

export type QuickOrderPFSchema = z.infer<typeof quickOrderPFSchema>

export const quickOrderPJSchema = z.object({
	cnpj: z.string()
		.min(18, "CNPJ inválido. Use formato 00.000.000/0000-00")
		.refine((val) => {
			const digits = val.replace(/\D/g, "")
			return digits.length === 14
		}, "CNPJ deve ter 14 dígitos")
		.refine(isValidCnpj, "CNPJ inválido"),
	company_name: z.string()
		.min(3, "Razão Social deve ter no mínimo 3 caracteres")
		.max(255, "Razão Social muito longa"),
	trading_name: z.string()
		.optional()
		.nullable()
		.transform(val => val || null),
	contact_name: z.string()
		.min(3, "Nome do responsável deve ter no mínimo 3 caracteres")
		.max(255, "Nome muito longo"),
	...contactSchema,
	...addressSchema,
	...financialTechnicalSchema,
})

export type QuickOrderPJSchema = z.infer<typeof quickOrderPJSchema>
