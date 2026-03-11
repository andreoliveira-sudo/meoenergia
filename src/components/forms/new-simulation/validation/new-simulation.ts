"use client"

import { z } from "zod"
import { brazilianStates, connectionVoltageTypes, energyProviders } from "@/lib/constants"

const numericString = (maxLength: number = 9, errorMessage: string = "Valor é obrigatório.") =>
	z
		.string(errorMessage)
		.min(1, errorMessage)
		.refine((val) => {
			const justDigits = val.replace(/\D/g, "")
			return justDigits.length <= maxLength
		}, `O valor não pode ter mais de ${maxLength} dígitos.`)

// ─────────────────────────────────────────────
// PASSO 1
// ─────────────────────────────────────────────

export const simulationStep1Schema = z.object({
	systemPower: numericString(9, "Potência é obrigatória."),
	currentConsumption: numericString(9, "Consumo é obrigatório."),
	energyProvider: z.enum(energyProviders as [string, ...string[]], "Selecione uma concessionária válida."),
	structureType: z.string().min(1, "Selecione um tipo de estrutura."),
	connectionVoltage: z.enum(connectionVoltageTypes as [string, ...string[]], "Selecione um tipo de conexão válido."),
	kit_module: z.string().min(1, "Selecione um módulo."),
	kit_inverter: z.string().min(1, "Selecione um inversor."),
	kit_others: z.string().optional().or(z.literal(""))
})

// Passo 1 para EDIÇÃO — campos técnicos opcionais (Fast Track)
export const editSimulationStep1Schema = simulationStep1Schema.extend({
	structureType: z.string().optional().or(z.literal("")),
	connectionVoltage: z
		.enum(connectionVoltageTypes as [string, ...string[]])
		.optional()
		.or(z.literal(""))
		.or(z.string().length(0)),
	kit_module: z.string().optional().or(z.literal("")),
	kit_inverter: z.string().optional().or(z.literal(""))
})

// ─────────────────────────────────────────────
// PASSO 2
// ─────────────────────────────────────────────

const baseStep2Fields = {
	contactName: z.string().min(3, "Nome do responsável é obrigatório."),
	contactPhone: z
		.string()
		.min(1, "Celular do responsável é obrigatório.")
		.refine(
			(val) => val.length === 14 || val.length === 15,
			"Número de celular inválido. Use (00) 00000-0000."
		),
	contactEmail: z.email("Email de contato inválido."),
	annualRevenue: numericString(15).optional().or(z.literal(""))
}

const simulationStep2PJSchema = z.object({
	...baseStep2Fields,
	type: z.literal("pj"),
	cnpj: z
		.string()
		.min(1, "CNPJ é obrigatório.")
		.refine(
			(value) => /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(value),
			"CNPJ inválido. Formato esperado: 00.000.000/0000-00"
		),
	legalName: z.string().min(2, "Razão social é obrigatória."),
	incorporationDate: z
		.string()
		.min(1, "Data de fundação é obrigatória.")
		.refine((val) => /^\d{2}\/\d{2}\/\d{4}$/.test(val), "Formato de data inválido. Use DD/MM/AAAA."),
	name: z.string().optional(),
	cpf: z.string().optional(),
	tradingName: z.string().optional(),
	ie: z.string().optional()
})

const simulationStep2PFSchema = z.object({
	...baseStep2Fields,
	type: z.literal("pf"),
	name: z.string().min(3, "Nome completo é obrigatório."),
	cpf: z
		.string()
		.min(1, "CPF é obrigatório.")
		.refine(
			(value) => /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(value),
			"CPF inválido. Formato esperado: 000.000.000-00"
		),
	cnpj: z.string().optional(),
	legalName: z.string().optional(),
	incorporationDate: z.string().optional()
})

export const simulationStep2Schema = z.discriminatedUnion("type", [
	simulationStep2PJSchema,
	simulationStep2PFSchema
])

// ─────────────────────────────────────────────
// PASSO 3
// ─────────────────────────────────────────────

export const simulationStep3Schema = z.object({
	cep: z.string().min(1, "CEP é obrigatório.").length(9, "CEP deve conter 8 dígitos. Formato: 00000-000"),
	street: z.string().min(1, "Rua é obrigatória."),
	number: z.string().min(1, "Número é obrigatório."),
	complement: z.string().optional(),
	neighborhood: z.string().min(1, "Bairro é obrigatório."),
	city: z.string().min(1, "Cidade é obrigatória."),
	state: z.enum(brazilianStates.map((s) => s.value) as [string, ...string[]], "Selecione um estado válido.")
})

// ─────────────────────────────────────────────
// PASSO 4
// ─────────────────────────────────────────────

export const simulationStep4Schema = z.object({
	equipmentValue: z
		.string()
		.min(1, "Valor dos equipamentos é obrigatório.")
		.transform((val) => {
			const clean = val.replace(/\D/g, "")
			return Number(clean) / 100
		}),
	laborValue: z
		.string()
		.min(1, "Valor da mão de obra é obrigatório.")
		.transform((val) => {
			const clean = val.replace(/\D/g, "")
			return Number(clean) / 100
		}),
	otherCosts: z
		.string()
		.optional()
		.or(z.literal(""))
		.transform((val) => {
			if (!val) return 0
			const clean = val.replace(/\D/g, "")
			return Number(clean) / 100
		}),

	monthlyBillValue: z
		.string()
		.optional()
		.or(z.literal(""))
		.transform((val) => {
			if (!val) return undefined
			const clean = val.replace(/\D/g, "")
			return Number(clean) / 100
		}),

	notes: z.string().optional(),

	financingTerm: z
		.string()
		.optional()
		.transform((val) => (val ? parseInt(val) : undefined)),
	paymentDay: z
		.string()
		.optional()
		.transform((val) => (val ? parseInt(val) : undefined))
})

// ─────────────────────────────────────────────
// PASSO 5
// ─────────────────────────────────────────────

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ACCEPTED_FILE_TYPES = ["application/pdf"]

const fileSchema = z
	.custom<FileList>(
		(val) => typeof window !== "undefined" && val instanceof FileList,
		{ message: "É necessário anexar um arquivo" }
	)
	.refine((files) => files?.length > 0, "É necessário anexar um arquivo.")
	.refine(
		(files) => Array.from(files).every((file) => file.size <= MAX_FILE_SIZE),
		"O tamanho máximo do arquivo é de 10MB."
	)
	.refine(
		(files) => Array.from(files).every((file) => ACCEPTED_FILE_TYPES.includes(file.type)),
		"Apenas arquivos .pdf são permitidos."
	)

const optionalFileSchema = z
	.custom<FileList>((val) => typeof window !== "undefined" && val instanceof FileList)
	.optional()
	.refine(
		(files) => !files || files.length === 0 || Array.from(files).every((file) => file.size <= MAX_FILE_SIZE),
		"O tamanho máximo do arquivo é de 10MB."
	)
	.refine(
		(files) =>
			!files ||
			files.length === 0 ||
			Array.from(files).every((file) => ACCEPTED_FILE_TYPES.includes(file.type)),
		"Apenas arquivos .pdf são permitidos."
	)

export const simulationStep5Schema = z.object({
	rgCnhSocios: optionalFileSchema,
	comprovantePropriedade: optionalFileSchema,
	contaDeEnergia: optionalFileSchema,
	balancoDRE2022: optionalFileSchema,
	balancoDRE2023: optionalFileSchema,
	balancoDRE2024: optionalFileSchema,
	relacaoFaturamento: optionalFileSchema,
	comprovanteEndereco: optionalFileSchema,
	irpfSocios: optionalFileSchema,
	fotosOperacao: optionalFileSchema,
	proposta: optionalFileSchema,
	balancoDRE2025: optionalFileSchema,
	contratoSocial: optionalFileSchema
})

export const editSimulationStep5Schema = z.object({
	rgCnhSocios: optionalFileSchema,
	comprovantePropriedade: optionalFileSchema,
	contaDeEnergia: optionalFileSchema,
	balancoDRE2022: optionalFileSchema,
	balancoDRE2023: optionalFileSchema,
	balancoDRE2024: optionalFileSchema,
	relacaoFaturamento: optionalFileSchema,
	comprovanteEndereco: optionalFileSchema,
	irpfSocios: optionalFileSchema,
	fotosOperacao: optionalFileSchema,
	proposta: optionalFileSchema,
	balancoDRE2025: optionalFileSchema,
	contratoSocial: optionalFileSchema
})

// ─────────────────────────────────────────────
// SCHEMAS COMPLETOS
// ─────────────────────────────────────────────

const staticStepsSchema = z.object({
	...simulationStep1Schema.shape,
	...simulationStep3Schema.shape,
	...simulationStep4Schema.shape,
	...simulationStep5Schema.shape
})

const editStaticStepsSchema = z.object({
	...editSimulationStep1Schema.shape,
	...simulationStep3Schema.shape,
	...simulationStep4Schema.shape,
	...editSimulationStep5Schema.shape
})

// Criação
export const newSimulationSchema = z.intersection(staticStepsSchema, simulationStep2Schema)

// Edição
export const editSimulationSchema = z.intersection(editStaticStepsSchema, simulationStep2Schema)

// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────

export type SimulationStep1Data = z.infer<typeof simulationStep1Schema>
export type SimulationStep2Data = z.infer<typeof simulationStep2Schema>
export type SimulationStep3Data = z.infer<typeof simulationStep3Schema>
export type SimulationStep4Data = z.infer<typeof simulationStep4Schema>
export type SimulationStep5Data = z.infer<typeof simulationStep5Schema>

export type SimulationData = z.infer<typeof newSimulationSchema>
export type SimulationInput = z.input<typeof newSimulationSchema>

export type EditSimulationData = z.infer<typeof editSimulationSchema>
export type EditSimulationInput = z.input<typeof editSimulationSchema>
