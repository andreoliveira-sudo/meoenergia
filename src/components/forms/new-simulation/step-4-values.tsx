"use client"

import { ArrowLeft, ArrowRight, DollarSign, Calendar, Clock } from "lucide-react"
import { useFormContext } from "react-hook-form"
import { useEffect, useRef, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { maskNumber } from "@/lib/masks"

const FINANCING_TERMS_PF = [24, 30, 36, 48, 60, 72, 84, 96]
const FINANCING_TERMS_PJ = [36, 48, 60]
const PAYMENT_DAYS = [5, 15, 20, 30]

type FeeRates = { managementFeePercent: number; serviceFeePercent: number }

type Step4Props = {
	onBack: () => void
	onNext?: () => void
	onSubmit?: () => void
	isLastStep?: boolean
	feeRates?: FeeRates
}

const formatCurrencyStatic = (value: number): string => {
	if (!value || isNaN(value)) return "R$ 0"
	return `R$ ${Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`
}

function useFormattedCurrency(value: number): string {
	const [mounted, setMounted] = useState(false)
	useEffect(() => { setMounted(true) }, [])
	if (!mounted) return formatCurrencyStatic(value)
	return new Intl.NumberFormat("pt-BR", {
		style: "currency", currency: "BRL",
		maximumFractionDigits: 0, minimumFractionDigits: 0,
	}).format(value || 0)
}

const parseCurrency = (value?: string): number => {
	if (!value) return 0
	return parseFloat(value.replace(/\D/g, "")) / 100 || 0
}

export function SimulationStep4({ onBack, onNext, onSubmit, isLastStep = false, feeRates }: Step4Props) {
	const form = useFormContext()

	// ── Mount guard ──────────────────────────────────────────────────────────
	const [mounted, setMounted] = useState(false)
	useEffect(() => { setMounted(true) }, [])

	// ── Tipo de cliente ──────────────────────────────────────────────────────
	const customerType = form.watch("type")
	const isPF = mounted ? customerType === "pf" : false
	const financingTerms = isPF ? FINANCING_TERMS_PF : FINANCING_TERMS_PJ

	// ── Taxas — usa prop do pai, com fallback seguro ─────────────────────────
	const rates: FeeRates = feeRates ?? { managementFeePercent: 8, serviceFeePercent: 8 }

	// ── Reset prazo/dia quando tipo muda ────────────────────────────────────
	const isFirstRender = useRef(true)
	const prevCustomerType = useRef(customerType)

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			prevCustomerType.current = customerType
			return
		}
		if (prevCustomerType.current !== customerType) {
			prevCustomerType.current = customerType
			form.setValue("financingTerm", "")
			form.setValue("paymentDay", "")
		}
	}, [customerType, form])

	// ── Cálculos ─────────────────────────────────────────────────────────────
	const [equipmentValue, laborValue] = form.watch(["equipmentValue", "laborValue"])

	const { subtotal, managementFeeValue, serviceFeeValue, totalValue } = useMemo(() => {
		const equipment = parseCurrency(equipmentValue)
		const labor     = parseCurrency(laborValue)
		const subtotal   = equipment + labor
		const management = subtotal * (rates.managementFeePercent / 100)
		const service    = (subtotal + management) * (rates.serviceFeePercent / 100)
		return {
			subtotal,
			managementFeeValue: management,
			serviceFeeValue:    service,
			totalValue:         subtotal + management + service,
		}
	}, [equipmentValue, laborValue, rates])

	const formattedSubtotal      = useFormattedCurrency(subtotal)
	const formattedManagementFee = useFormattedCurrency(managementFeeValue)
	const formattedServiceFee    = useFormattedCurrency(serviceFeeValue)
	const formattedTotal         = useFormattedCurrency(totalValue)

	// ── Sincroniza no form ───────────────────────────────────────────────────
	useEffect(() => {
		form.setValue("otherCosts",     serviceFeeValue.toFixed(2))
		form.setValue("managementFee",  managementFeeValue.toFixed(2))
	}, [serviceFeeValue, managementFeeValue, form])

	// ── Ação principal ───────────────────────────────────────────────────────
	const handlePrimaryAction = async () => {
		if (!form.getValues("financingTerm")) {
			form.setError("financingTerm", { message: "Selecione o prazo de financiamento" })
			return
		}
		if (!form.getValues("paymentDay")) {
			form.setError("paymentDay", { message: "Selecione o dia de pagamento" })
			return
		}
		isLastStep ? onSubmit?.() : onNext?.()
	}

	// ── Render ───────────────────────────────────────────────────────────────
	return (
		<div className="space-y-8">
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

				{/* LEFT COLUMN */}
				<div className="space-y-6">
					<h3 className="text-lg font-medium">Passo 4: Valores e Condições</h3>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<FormField
							control={form.control}
							name="equipmentValue"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Equipamentos *</FormLabel>
									<FormControl>
										<div className="relative">
											<DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
											<Input placeholder="0,00" className="pl-9" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(maskNumber(e.target.value, 14))} />
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="laborValue"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Mão de Obra *</FormLabel>
									<FormControl>
										<div className="relative">
											<DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
											<Input placeholder="0,00" className="pl-9" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(maskNumber(e.target.value, 14))} />
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					{/* RESUMO FINANCEIRO */}
					<div className="p-4 bg-muted/30 rounded-lg border border-dashed space-y-2">
						<div className="flex justify-between text-sm">
							<span className="text-muted-foreground">Subtotal</span>
							<span suppressHydrationWarning>{formattedSubtotal}</span>
						</div>
						<div className="flex justify-between text-sm">
							<span className="text-muted-foreground">Tarifa de Gestão</span>
							<span className="font-medium text-blue-600" suppressHydrationWarning>{formattedManagementFee}</span>
						</div>
						<div className="flex justify-between text-sm">
							<span className="text-muted-foreground">Tarifa de Contratação</span>
							<span className="font-medium text-blue-600" suppressHydrationWarning>{formattedServiceFee}</span>
						</div>
						<div className="border-t pt-2 mt-2 flex justify-between font-bold">
							<span>Total da Proposta</span>
							<span className="text-lg" suppressHydrationWarning>{formattedTotal}</span>
						</div>
					</div>

					{/* PRAZO + DIA */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<FormField
							control={form.control}
							name="financingTerm"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Prazo (Meses) *</FormLabel>
									<Select onValueChange={field.onChange} value={field.value != null ? String(field.value) : ""}>
										<FormControl>
											<SelectTrigger className="pl-9 relative">
												<Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
												<SelectValue placeholder="Selecione..." />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{financingTerms.map((term) => (
												<SelectItem key={term} value={String(term)}>{term} meses</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="paymentDay"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Dia de Pagamento *</FormLabel>
									<Select onValueChange={field.onChange} value={field.value != null ? String(field.value) : ""}>
										<FormControl>
											<SelectTrigger className="pl-9 relative">
												<Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
												<SelectValue placeholder="Selecione..." />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{PAYMENT_DAYS.map((day) => (
												<SelectItem key={day} value={String(day)}>Dia {String(day).padStart(2, "0")}</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<FormField
						control={form.control}
						name="notes"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Observações</FormLabel>
								<FormControl>
									<Textarea className="min-h-[100px]" placeholder="Informações adicionais..." {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				{/* RIGHT COLUMN */}
				<div>
					<Card className="border-l-4 border-l-primary shadow-md">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<DollarSign className="w-5 h-5 text-primary" />
								Resumo do Pedido
							</CardTitle>
							<CardDescription>Revise antes de finalizar.</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex flex-col items-center py-8 rounded-xl bg-primary/5 border">
								<span className="text-sm text-muted-foreground">Total do Pedido</span>
								<span className="text-3xl font-bold text-primary" suppressHydrationWarning>
									{formattedTotal}
								</span>
							</div>
							<div className="space-y-2 text-sm">
								<div className="flex justify-between text-muted-foreground">
									<span>Subtotal</span>
									<span suppressHydrationWarning>{formattedSubtotal}</span>
								</div>
								<div className="flex justify-between text-muted-foreground">
									<span>Gestão</span>
									<span suppressHydrationWarning>{formattedManagementFee}</span>
								</div>
								<div className="flex justify-between text-muted-foreground">
									<span>Contratação</span>
									<span suppressHydrationWarning>{formattedServiceFee}</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			{/* FOOTER */}
			<div className="flex justify-between pt-8 border-t">
				<Button type="button" variant="outline" onClick={onBack}>
					<ArrowLeft className="mr-2 h-4 w-4" />
					Voltar
				</Button>
				<Button type="button" onClick={handlePrimaryAction} disabled={form.formState.isSubmitting}>
					{isLastStep ? "Salvar Pedido" : "Próximo"}
					<ArrowRight className="ml-2 h-4 w-4" />
				</Button>
			</div>
		</div>
	)
}
