"use client"

import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { AnimatePresence, motion } from "framer-motion"
import { Loader2 } from "lucide-react"
import * as React from "react"
import { FormProvider, useForm } from "react-hook-form"
import { toast } from "sonner"
import { useOperationFeedback } from "@/components/feedback/operation-feedback"

import { getOrderById, updateOrder } from "@/actions/orders"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useSimulation } from "@/contexts/simulation-context"
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
	editSimulationStep1Schema,
	editSimulationStep5Schema,
	simulationStep2Schema,
	simulationStep3Schema,
	simulationStep4Schema
} from "./new-simulation/validation/new-simulation"

const STEPS_CONFIG = [
	{ id: 1, name: "Dados do Projeto", schema: editSimulationStep1Schema },
	{ id: 2, name: "Dados do Cliente", schema: simulationStep2Schema },
	{ id: 3, name: "Instalação", schema: simulationStep3Schema },
	{ id: 4, name: "Valores", schema: simulationStep4Schema },
	{ id: 5, name: "Documentos", schema: editSimulationStep5Schema }
]

type ExtendedOrderData = EditSimulationData & {
	kit_module_brand_id?: string | null
	kit_inverter_brand_id?: string | null
	kit_others_brand_id?: string | null
}

type ExtendedOrderInput = z.input<typeof editSimulationSchema> & {
	kit_module_brand_id?: string | null
	kit_inverter_brand_id?: string | null
	kit_others_brand_id?: string | null
}

function OrderStepper({ currentStep }: { currentStep: number }) {
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

function EditOrderContent({
	orderId,
	customerId,
	onFinished,
	initialData
}: {
	orderId: string
	customerId: string
	onFinished: () => void
	initialData: ExtendedOrderInput
}) {
	const [currentStep, setCurrentStep] = React.useState(1)
	const queryClient = useQueryClient()
	const { execute } = useOperationFeedback()

	const form = useForm<ExtendedOrderInput, any, ExtendedOrderData>({
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
					const fieldName = error.path[0] as keyof ExtendedOrderInput
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
		execute({
			action: () => updateOrder({ orderId, customerId, data }),
			loadingMessage: "Atualizando pedido...",
			successMessage: "Pedido atualizado com sucesso!",
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ["orders"] })
				queryClient.invalidateQueries({ queryKey: ["order-details", orderId] })
				queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
				onFinished()
			}
		})
	}

	return (
		<FormProvider {...form}>
			<Card className="w-full border-0 shadow-none">
				<CardHeader>
					<OrderStepper currentStep={currentStep} />
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
								/>
							)}
							{currentStep === 5 && <SimulationStep5 onSubmit={form.handleSubmit(handleSubmitEntireForm)} onBack={backStep} orderId={orderId} />}
						</motion.div>
					</AnimatePresence>
				</CardContent>
			</Card>
		</FormProvider>
	)
}

export function EditOrderForm({ orderId, onFinished }: { orderId: string; onFinished: () => void }) {
	const { setIsCustomerDataLocked } = useSimulation()
	const {
		data: queryData,
		isLoading,
		error,
		isSuccess
	} = useQuery({
		queryKey: ["order-details", orderId],
		queryFn: () => getOrderById(orderId),
		enabled: !!orderId
	})

	React.useEffect(() => {
		if (isSuccess && queryData?.success) {
			setIsCustomerDataLocked(true)
		}
	}, [isSuccess, queryData, setIsCustomerDataLocked])

	if (isLoading) {
		return (
			<div className="flex items-center justify-center p-8">
				<Loader2 className="h-8 w-8 animate-spin" />
				<p className="ml-4">Carregando dados do pedido...</p>
			</div>
		)
	}

	if (error || !queryData?.success || !queryData.data) {
		return <p className="text-destructive text-center">Erro ao carregar os dados do pedido. Tente novamente.</p>
	}

	const { customer, ...order } = queryData.data

	const isPf = customer.type === "pf" || (!!customer.cpf && !customer.cnpj)

	const commonData = {
		systemPower: formatNumberFromDatabase(order.system_power),
		currentConsumption: formatNumberFromDatabase(order.current_consumption),
		energyProvider: order.energy_provider || "",
		structureType: order.structure_type || "",
		connectionVoltage: order.connection_voltage || "",
		notes: order.notes || "",
		kit_module: order.kit_module_id?.toString() || "",
		kit_inverter: order.kit_inverter_id?.toString() || "",
		kit_others: order.kit_others?.toString() || "",
		kit_module_brand_id: order.kit_module_brand_id,
		kit_inverter_brand_id: order.kit_inverter_brand_id,
		kit_others_brand_id: order.kit_others_brand_id,
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
		equipmentValue: formatNumberFromDatabase(order.equipment_value),
		laborValue: formatNumberFromDatabase(order.labor_value),
		otherCosts: formatNumberFromDatabase(order.other_costs),
		monthlyBillValue: "",
		financingTerm: order.financing_term ? String(order.financing_term) : "",
		paymentDay: order.payment_day ? String(order.payment_day) : "",
		rgCnhSocios: undefined,
		comprovantePropriedade: undefined,
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

	const initialData: ExtendedOrderInput = isPf
		? {
			...commonData,
			type: "pf",
			name: customer.name || "",
			cpf: customer.cpf ? maskCpf(customer.cpf) : "",
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
			name: undefined,
			cpf: undefined
		}

	return (
		<EditOrderContent
			orderId={orderId}
			customerId={customer.id}
			onFinished={onFinished}
			initialData={initialData}
		/>
	)
}
