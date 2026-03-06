// edit-simulation-form.tsx
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { AnimatePresence, motion } from "framer-motion"
import { Loader2 } from "lucide-react"
import * as React from "react"
import { FormProvider, useForm } from "react-hook-form"
import { toast } from "sonner"

import { getSimulationById, updateSimulation } from "@/actions/simulations"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { formatNumberFromDatabase, maskCep, maskCnpj, maskCpf, maskPhone } from "@/lib/masks"
import { cn } from "@/lib/utils"
import { SimulationStep1 } from "./new-simulation/step-1-project-data"
import { SimulationStep2 } from "./new-simulation/step-2-client-data"
import { SimulationStep3 } from "./new-simulation/step-3-installation"
import { SimulationStep4 } from "./new-simulation/step-4-values"
import { SimulationStep5 } from "./new-simulation/step-5-documents"
import {
	type EditSimulationData,
	editSimulationSchema,
	editSimulationStep5Schema,
	simulationStep1Schema,
	simulationStep2Schema,
	simulationStep3Schema,
	simulationStep4Schema
} from "./new-simulation/validation/new-simulation"

const STEPS_CONFIG = [
	{ id: 1, name: "Dados do Projeto", schema: simulationStep1Schema },
	{ id: 2, name: "Dados do Cliente", schema: simulationStep2Schema },
	{ id: 3, name: "Instalação", schema: simulationStep3Schema },
	{ id: 4, name: "Valores", schema: simulationStep4Schema },
	{ id: 5, name: "Documentos", schema: editSimulationStep5Schema }
]

type ExtendedSimulationData = EditSimulationData & {
	kit_module_brand_id?: string | null
	kit_inverter_brand_id?: string | null
	kit_others_brand_id?: string | null
}

function SimulationStepper({ currentStep }: { currentStep: number }) {
	return (
		<div className="flex w-full items-start pt-6">
			{STEPS_CONFIG.map((stepConfig, index) => (
				<React.Fragment key={stepConfig.id}>
					<div className="flex flex-1 flex-col items-center">
						<div
							className={cn(
								"flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold transition-all",
								currentStep >= stepConfig.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
							)}
						>
							{stepConfig.id}
						</div>
						<p
							className={cn(
								"mt-2 text-center text-sm font-medium",
								currentStep >= stepConfig.id ? "text-primary" : "text-muted-foreground",
								currentStep !== stepConfig.id && "hidden md:block"
							)}
						>
							{stepConfig.name}
						</p>
					</div>
					{index < STEPS_CONFIG.length - 1 && (
						<div className={cn("mt-4 h-1 flex-1 bg-border transition-colors", currentStep > stepConfig.id && "bg-primary")} />
					)}
				</React.Fragment>
			))}
		</div>
	)
}

function EditSimulationContent({
	simulationId,
	customerId,
	onFinished,
	initialData,
	initialServiceFee36,
	initialServiceFee48,
	initialServiceFee60,
	initialInterestRate36,
	initialInterestRate48,
	initialInterestRate60
}: {
	simulationId: string
	customerId: string
	onFinished: () => void
	initialData: ExtendedSimulationData
	initialServiceFee36: number
	initialServiceFee48: number
	initialServiceFee60: number
	initialInterestRate36: number
	initialInterestRate48: number
	initialInterestRate60: number
}) {
	const [currentStep, setCurrentStep] = React.useState(1)
	const queryClient = useQueryClient()

	const form = useForm<ExtendedSimulationData>({
		resolver: zodResolver(editSimulationSchema),
		defaultValues: initialData,
		mode: "onChange"
	})

	const validateCurrentStep = async (step: number): Promise<boolean> => {
		const stepSchema = STEPS_CONFIG[step - 1]?.schema
		if (!stepSchema) return true

		const currentData = form.getValues()
		const result = await stepSchema.safeParseAsync(currentData)

		if (!result.success) {
			const errors = result.error.issues
			errors.forEach((error) => {
				if (error.path.length > 0) {
					const fieldName = error.path[0] as keyof ExtendedSimulationData
					form.setError(fieldName, {
						type: "manual",
						message: error.message
					})
				}
			})

			toast.error("Preencha todos os campos obrigatórios", {
				description: `Encontrados ${errors.length} erro${errors.length > 1 ? "s" : ""} no formulário`
			})

			return false
		}

		return true
	}

	const nextStep = async () => {
		const isValid = await validateCurrentStep(currentStep)
		if (isValid) {
			setCurrentStep((prev) => Math.min(prev + 1, STEPS_CONFIG.length))
		}
	}

	const backStep = () => {
		setCurrentStep((prev) => Math.max(prev - 1, 1))
	}

	const motionVariants = {
		initial: { opacity: 0, x: -20 },
		animate: { opacity: 1, x: 0 },
		exit: { opacity: 0, x: 20 }
	}

	const handleSubmitEntireForm = (data: EditSimulationData) => {
		const finalData = { ...initialData, ...data }

		const result = editSimulationSchema.safeParse(finalData)

		if (!result.success) {
			toast.error("Erro de validação final", {
				description: "Alguns dados parecem estar inconsistentes. Por favor, revise os passos."
			})
			console.error("Final Validation Error:", result.error.flatten().fieldErrors)
			return
		}

		toast.promise(updateSimulation({ simulationId, customerId, data: result.data }), {
			loading: "Atualizando simulação...",
			success: (res) => {
				if (res.success) {
					queryClient.invalidateQueries({ queryKey: ["simulations"] })
					queryClient.invalidateQueries({ queryKey: ["simulation-details", simulationId] })
					onFinished()
					return "Simulação atualizada com sucesso!"
				}
				throw new Error(res.message)
			},
			error: (err: Error) => {
				return err.message || "Ocorreu um erro inesperado."
			}
		})
	}

	return (
		<FormProvider {...form}>
			<Card className="w-full border-0 shadow-none">
				<CardHeader>
					<SimulationStepper currentStep={currentStep} />
				</CardHeader>
				<CardContent>
					<AnimatePresence mode="wait">
						<motion.div
							key={currentStep}
							variants={motionVariants}
							initial="initial"
							animate="animate"
							exit="exit"
							transition={{ duration: 0.3 }}
							className="mt-8"
						>
							{currentStep === 1 && <SimulationStep1 onNext={nextStep} />}
							{currentStep === 2 && <SimulationStep2 onNext={nextStep} onBack={backStep} />}
							{currentStep === 3 && <SimulationStep3 onNext={nextStep} onBack={backStep} />}
							{currentStep === 4 && (
								<SimulationStep4
									onNext={nextStep}
									onBack={backStep}
									initialInterestRate36={initialInterestRate36}
									initialInterestRate48={initialInterestRate48}
									initialInterestRate60={initialInterestRate60}
									initialServiceFee36={initialServiceFee36}
									initialServiceFee48={initialServiceFee48}
									initialServiceFee60={initialServiceFee60}
									isEditing={true}
								/>
							)}
							{currentStep === 5 && <SimulationStep5 onSubmit={form.handleSubmit(handleSubmitEntireForm)} onBack={backStep} />}
						</motion.div>
					</AnimatePresence>
				</CardContent>
			</Card>
		</FormProvider>
	)
}

export function EditSimulationForm({ simulationId, onFinished }: { simulationId: string; onFinished: () => void }) {
	const {
		data: queryData,
		isLoading,
		error
	} = useQuery({
		queryKey: ["simulation-details", simulationId],
		queryFn: () => getSimulationById(simulationId),
		staleTime: 5 * 60 * 1000,
		refetchOnWindowFocus: false,
		enabled: !!simulationId
	})

	if (isLoading) {
		return (
			<div className="flex items-center justify-center p-8">
				<Loader2 className="h-8 w-8 animate-spin" />
				<p className="ml-4">Carregando dados da simulação...</p>
			</div>
		)
	}

	if (error || !queryData?.success || !queryData.data) {
		return <p className="text-destructive text-center">Erro ao carregar os dados da simulação. Tente novamente.</p>
	}

	const { customer, ...simulation } = queryData.data

	const isPf = customer.type === "pf" || (!!customer.cpf && !customer.cnpj)

	const commonData = {
		systemPower: formatNumberFromDatabase(simulation.system_power),
		currentConsumption: formatNumberFromDatabase(simulation.current_consumption),
		energyProvider: simulation.energy_provider || "",
		structureType: simulation.structure_type || "",
		connectionVoltage: simulation.connection_voltage || "",
		notes: simulation.notes || "",
		kit_module: simulation.kit_module_id?.toString() || "",
		kit_inverter: simulation.kit_inverter_id?.toString() || "",
		kit_others: simulation.kit_others?.toString() || "",
		kit_module_brand_id: simulation.kit_module_brand_id,
		kit_inverter_brand_id: simulation.kit_inverter_brand_id,
		kit_others_brand_id: simulation.kit_others_brand_id,
		annualRevenue: formatNumberFromDatabase(customer.annual_revenue),
		contactName: customer.contact_name,
		contactPhone: maskPhone(customer.contact_phone),
		contactEmail: customer.contact_email,
		cep: maskCep(customer.postal_code),
		street: customer.street,
		number: customer.number,
		complement: customer.complement || "",
		neighborhood: customer.neighborhood,
		city: customer.city,
		state: customer.state,
		equipmentValue: formatNumberFromDatabase(simulation.equipment_value),
		laborValue: formatNumberFromDatabase(simulation.labor_value),
		otherCosts: formatNumberFromDatabase(simulation.other_costs),
		// Os campos de arquivo são iniciados como undefined para edição
		rgCnhSocios: undefined,
		balancoDRE2022: undefined,
		balancoDRE2023: undefined,
		balancoDRE2024: undefined,
		relacaoFaturamento: undefined,
		comprovanteEndereco: undefined,
		irpfSocios: undefined,
		fotosOperacao: undefined,
		contaDeEnergia: undefined,
		balancoDRE2025: undefined,
		contratoSocial: undefined,
		proposta: undefined
	}

	const initialData: ExtendedSimulationData = isPf
		? {
			...commonData,
			type: "pf",
			name: customer.name || "",
			cpf: customer.cpf ? maskCpf(customer.cpf) : "",
			// Campos PJ ignorados/opcionais
			legalName: undefined,
			cnpj: undefined,
			incorporationDate: undefined
		}
		: {
			...commonData,
			type: "pj",
			legalName: customer.company_name || "",
			cnpj: maskCnpj(customer.cnpj || ""),
			incorporationDate: customer.incorporation_date ? customer.incorporation_date.split("-").reverse().join("/") : "",
			// Campos PF ignorados/opcionais
			name: undefined,
			cpf: undefined
		}

	return (
		<EditSimulationContent
			simulationId={simulationId}
			customerId={customer.id}
			onFinished={onFinished}
			initialData={initialData}
			initialInterestRate36={simulation.interest_rate_36 || 0}
			initialInterestRate48={simulation.interest_rate_48 || 0}
			initialInterestRate60={simulation.interest_rate_60 || 0}
			initialServiceFee36={simulation.service_fee_36 || 0}
			initialServiceFee48={simulation.service_fee_48 || 0}
			initialServiceFee60={simulation.service_fee_60 || 0}
		/>
	)
}
