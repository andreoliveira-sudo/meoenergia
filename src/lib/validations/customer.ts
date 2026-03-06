"use client"

import { z } from "zod"
import { brazilianStates } from "@/lib/constants"

const stateValues = brazilianStates.map((s) => s.value) as [string, ...string[]]

// Schema base com campos comuns
const baseCustomerSchema = z.object({
	contact_name: z.string().min(3, "Nome do responsável deve ter no mínimo 3 caracteres."),
	contact_phone: z.string().refine((val) => val.length === 14 || val.length === 15, "Celular inválido. Use (00) 00000-0000 ou (00) 0000-0000"),
	contact_email: z.email("Por favor, insira um email válido."),
	postal_code: z.string().length(9, "CEP deve conter 8 dígitos. Formato: 00000-000"),
	street: z.string().min(1, "Rua é obrigatória."),
	number: z.string().min(1, "Número é obrigatório."),
	complement: z.string().optional(),
	neighborhood: z.string().min(1, "Bairro é obrigatório."),
	city: z.string().min(1, "Cidade é obrigatória."),
	state: z.enum(stateValues, { message: "Selecione um estado válido." }),
	annual_revenue: z.string().optional(),
	incorporation_date: z
		.string()
		.optional()
		.refine((val) => !val || /^\d{2}\/\d{2}\/\d{4}$/.test(val), "Formato de data inválido. Use DD/MM/AAAA.")
})

// Schema para Pessoa Física
export const pfCustomerSchema = baseCustomerSchema.extend({
	type: z.literal("pf"),
	name: z.string().min(3, "Nome completo é obrigatório"),
	cpf: z.string().min(14, "CPF obrigatório"), // Considerando máscara 000.000.000-00
	rg: z.string().optional(),
	// Campos de PJ opcionais/ignorados
	company_name: z.string().optional(),
	cnpj: z.string().optional(),
	ie: z.string().optional()
})

// Schema para Pessoa Jurídica
export const pjCustomerSchema = baseCustomerSchema.extend({
	type: z.literal("pj"),
	company_name: z.string().min(2, "Razão social deve ter no mínimo 2 caracteres."),
	cnpj: z.string().min(18, "CNPJ obrigatório"), // Considerando máscara 00.000.000/0000-00
	ie: z.string().optional(), // IE pode ser isento
	// Campos de PF opcionais/ignorados
	name: z.string().optional(),
	cpf: z.string().optional(),
	rg: z.string().optional()
})

export type PfCustomerSchema = z.infer<typeof pfCustomerSchema>
export type PjCustomerSchema = z.infer<typeof pjCustomerSchema>
export type CustomerSchema = PfCustomerSchema | PjCustomerSchema

// Factory para resolver o schema correto
export function getCustomerSchema(type: "pf" | "pj") {
	return type === "pf" ? pfCustomerSchema : pjCustomerSchema
}

// Helpers e Transforms (mantidos para compatibilidade, mas ideais de serem refatorados futuramente)
const parseCurrency = (value: string | undefined): number | null => {
	if (!value || value.trim() === "") return null
	const numberValue = parseFloat(value.replace(/\./g, "").replace(",", "."))
	return isNaN(numberValue) ? null : numberValue
}

// Schema de transformação para envio ao backend (mantendo compatibilidade com actions existentes)
export const editCustomerSchema = z.union([pfCustomerSchema, pjCustomerSchema]).transform((data) => {
	const common = {
		...data,
		incorporation_date: data.incorporation_date ? data.incorporation_date.split("/").reverse().join("-") : null,
		annual_revenue: parseCurrency(data.annual_revenue),
		contact_phone: data.contact_phone.replace(/\D/g, ""),
		postal_code: data.postal_code.replace(/\D/g, "")
	}

	if (data.type === "pf") {
		return {
			...common,
			cpf: data.cpf?.replace(/\D/g, ""),
			// Garantir que campos PJ sejam null/undefined se não usados
			cnpj: undefined,
			ie: undefined,
			company_name: undefined
		}
	} else {
		return {
			...common,
			cnpj: data.cnpj?.replace(/\D/g, ""),
			// Garantir que campos PF sejam null/undefined se não usados
			cpf: undefined,
			rg: undefined,
			name: undefined
		}
	}
})

export type EditCustomerData = z.infer<typeof editCustomerSchema>


