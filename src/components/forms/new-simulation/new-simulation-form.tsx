// src/components/forms/new-simulation/new-simulation-form.tsx
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { AnimatePresence, motion } from "framer-motion"
import * as React from "react"
import { FormProvider, useForm } from "react-hook-form"
import { toast } from "sonner"

import { createInternalSimulation } from "@/actions/simulations"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useSimulation } from "@/contexts/simulation-context"
import { cn } from "@/lib/utils"
import { SimulationStep1 } from "./step-1-project-data"
import { SimulationStep2 } from "./step-2-client-data"
import { SimulationStep3 } from "./step-3-installation"
import { SimulationStep4 } from "./step-4-values"
import { SimulationStep5 } from "./step-5-documents"
import {
	newSimulationSchema,
	type SimulationData,
	simulationStep1Schema,
	simulationStep2Schema,
	simulationStep3Schema,
	simulationStep4Schema,
	simulationStep5Schema
} from "./validation/new-simulation"

const STEPS_CONFIG = [
	{ id: 1, name: "Dados do Projeto", schema: simulationStep1Schema },
	{ id: 2, name: "Dados do Cliente", schema: simulationStep2Schema },
	{ id: 3, name: "Instalação", schema: simulationStep3Schema },
	{ id: 4, name: "Valores", schema: simulationStep4Schema },
	{ id: 5, name: "Documentos", schema: simulationStep5Schema }
]

type ExtendedSimulationData = SimulationData & {
	kit_module_brand_id?: string
	kit_inverter_brand_id?: string
	kit_others_brand_id?: string
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

export function NewSimulationForm({
	className,
	initialData,
	isDisabled = false
}: {
	className?: string
	initialData?: Partial<ExtendedSimulationData>
	isDisabled?: boolean
}) {
	const [currentStep, setCurrentStep] = React.useState(1)
	const [createOrderFromSimulation, setCreateOrderFromSimulation] = React.useState<boolean>(true)
	const { partnerId, sellerId, clearContext } = useSimulation()

	const form = useForm<ExtendedSimulationData>({
		resolver: zodResolver(newSimulationSchema),
		defaultValues: {
			systemPower: "",
			type: "pj",
			currentConsumption: "",
			energyProvider: "",
			structureType: "",
			connectionVoltage: "",
			notes: "",
			kit_module: "",
			kit_inverter: "",
			kit_others: "",
			kit_module_brand_id: "",
			kit_inverter_brand_id: "",
			kit_others_brand_id: "",
			cnpj: "",
			legalName: "",
			incorporationDate: "",
			annualRevenue: "",
			contactName: "",
			contactPhone: "",
			contactEmail: "",
			cep: "",
			street: "",
			number: "",
			complement: "",
			neighborhood: "",
			city: "",
			state: "",
			equipmentValue: "",
			laborValue: "",
			otherCosts: "",
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
			proposta: undefined,
			...initialData
		},
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

	const handleSubmitEntireForm = async () => {
		const isValid = await validateCurrentStep(currentStep)
		if (!isValid) return

		const formData = form.getValues()
		const result = newSimulationSchema.safeParse(formData)

		if (!result.success) {
			toast.error("Erro de validação final", {
				description: "Alguns dados parecem estar inconsistentes. Por favor, revise os passos."
			})
			console.error("Final Validation Error:", result.error)
			return
		}

		if (!partnerId) {
			toast.error("Contexto inválido", {
				description: "O ID do parceiro não foi definido. Por favor, reinicie o processo de simulação."
			})
			return
		}

		const simulationContext = {
			partnerId,
			sellerId
		}

		toast.promise(createInternalSimulation(result.data, simulationContext, createOrderFromSimulation), {
			loading: "Salvando simulação...",
			success: (res) => {
				if (res.success) {
					form.reset()
					setCurrentStep(1)
					clearContext()
					return `Simulação #${res.data.kdi} salva com sucesso!`
				}
				throw new Error(res.message)
			},
			error: (err: Error) => {
				return err.message || "Ocorreu um erro inesperado."
			}
		})
	}

	const motionVariants = {
		initial: { opacity: 0, x: -20 },
		animate: { opacity: 1, x: 0 },
		exit: { opacity: 0, x: 20 }
	}

	return (
		<fieldset disabled={isDisabled} className="group">
			<FormProvider {...form}>
				<Card className={cn("w-full border-0 shadow-none group-disabled:opacity-50 group-disabled:pointer-events-none", className)}>
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
								{currentStep === 4 && <SimulationStep4 onNext={nextStep} onBack={backStep} />}
								{currentStep === 5 && (
									<SimulationStep5
										onSubmit={handleSubmitEntireForm}
										onBack={backStep}
										createOrderFromSimulation={createOrderFromSimulation}
										showInputs={true}
										onToggleCreateOrderFromSimulation={(value) => setCreateOrderFromSimulation(value)}
									/>
								)}
							</motion.div>
						</AnimatePresence>
					</CardContent>
				</Card>
			</FormProvider>
		</fieldset>
	)
}
