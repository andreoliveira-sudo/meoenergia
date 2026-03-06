/** biome-ignore-all lint/suspicious/noArrayIndexKey: <dont need this> */
"use client"

import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, ArrowRight, DollarSign } from "lucide-react"
import { useFormContext } from "react-hook-form"

import { getRate } from "@/actions/settings"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { maskNumber } from "@/lib/masks"
import { calculateInstallmentPayment } from "@/lib/utils"

const formatCurrency = (value: number): string => {
	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL"
	}).format(value || 0)
}

const parseCurrency = (value: string | undefined): number => {
	if (!value) return 0
	return parseFloat(value.replace(/\D/g, "")) / 100 || 0
}

const installmentTerms = [12, 24, 36, 48, 60, 72]

// Tipagem melhorada para os props
type Step4PropsCreate = {
	onNext: () => void
	onBack: () => void
	isEditing?: false | null | undefined
	initialServiceFee36?: never
	initialServiceFee48?: never
	initialServiceFee60?: never
	initialInterestRate36?: never
	initialInterestRate48?: never
	initialInterestRate60?: never
}

type Step4PropsEdit = {
	onNext: () => void
	onBack: () => void
	isEditing: true
	initialServiceFee36: number
	initialServiceFee48: number
	initialServiceFee60: number
	initialInterestRate36: number
	initialInterestRate48: number
	initialInterestRate60: number
}

type Step4Props = Step4PropsCreate | Step4PropsEdit

const SimulationStep4 = ({
	onNext,
	onBack,
	initialServiceFee36,
	initialServiceFee48,
	initialServiceFee60,
	isEditing,
	initialInterestRate36,
	initialInterestRate48,
	initialInterestRate60
}: Step4Props) => {
	const form = useFormContext()

	const { data: rates, isLoading: isLoadingRates } = useQuery({
		queryKey: ["rates", "interest_rate_36", "interest_rate_48", "interest_rate_60", "service_fee_36", "service_fee_48", "service_fee_60"],
		queryFn: async () => {
			const [interestRate36Res, interestRate48Res, interestRate60Res, serviceFee36Res, serviceFee48Res, serviceFee60Res] = await Promise.all([
				getRate("interest_rate_36"),
				getRate("interest_rate_48"),
				getRate("interest_rate_60"),
				getRate("service_fee_36"),
				getRate("service_fee_48"),
				getRate("service_fee_60")
			])

			if (
				!interestRate36Res.success ||
				!interestRate48Res.success ||
				!interestRate60Res.success ||
				!serviceFee36Res.success ||
				!serviceFee48Res.success ||
				!serviceFee60Res.success
			) {
				throw new Error("Não foi possível carregar as taxas de juros e serviços para a simulação.")
			}

			return {
				interest_rate_36: interestRate36Res.data / 100,
				interest_rate_48: interestRate48Res.data / 100,
				interest_rate_60: interestRate60Res.data / 100,
				service_fee_36: serviceFee36Res.data / 100,
				service_fee_48: serviceFee48Res.data / 100,
				service_fee_60: serviceFee60Res.data / 100
			}
		},
		staleTime: 5 * 60 * 1000, // 5 minutes
		retry: 3,
		retryDelay: 1000,
		enabled: !isEditing
	})

	const watchedStringValues = form.watch(["equipmentValue", "laborValue", "otherCosts"])

	const [equipment, labor, others] = watchedStringValues.map(parseCurrency)
	const subtotal = (equipment || 0) + (labor || 0) + (others || 0)

	// Lógica para determinar qual serviceFee usar
	const serviceFee36 = isEditing ? initialServiceFee36 / 100 : (rates?.service_fee_36 ?? 0.35)
	const serviceFee48 = isEditing ? initialServiceFee48 / 100 : (rates?.service_fee_48 ?? 0.35)
	const serviceFee60 = isEditing ? initialServiceFee60 / 100 : (rates?.service_fee_60 ?? 0.35)

	const interestRate36 = isEditing ? initialInterestRate36 / 100 : (rates?.interest_rate_36 ?? 0.021)
	const interestRate48 = isEditing ? initialInterestRate48 / 100 : (rates?.interest_rate_48 ?? 0.021)
	const interestRate60 = isEditing ? initialInterestRate60 / 100 : (rates?.interest_rate_60 ?? 0.021)

	const servicesValue36 = subtotal * serviceFee36
	const servicesValue48 = subtotal * serviceFee48
	const servicesValue60 = subtotal * serviceFee60

	const formattedServicesValue36 = formatCurrency(servicesValue36)
	const formattedServicesValue48 = formatCurrency(servicesValue48)
	const formattedServicesValue60 = formatCurrency(servicesValue60)

	const totalInvestment36 = subtotal + servicesValue36
	const totalInvestment48 = subtotal + servicesValue48
	const totalInvestment60 = subtotal + servicesValue60

	const formattedTotalInvestment36 = formatCurrency(totalInvestment36)
	const formattedTotalInvestment48 = formatCurrency(totalInvestment48)
	const formattedTotalInvestment60 = formatCurrency(totalInvestment60)

	return (
		<form className="space-y-6">
			<div className="grid grid-cols-1 @lg:grid-cols-2 gap-6">
				<div className="w-full space-y-6">
					<h3 className="text-lg font-medium">Passo 4: Valores</h3>
					<FormField
						control={form.control}
						name="equipmentValue"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Valor dos Equipamentos *</FormLabel>
								<FormControl>
									<div className="relative">
										<DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
										<Input type="text" placeholder="0,00" className="pl-9" {...field} onChange={(e) => field.onChange(maskNumber(e.target.value, 14))} />
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
								<FormLabel>Valor da Mão de Obra *</FormLabel>
								<FormControl>
									<div className="relative">
										<DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
										<Input type="text" placeholder="0,00" className="pl-9" {...field} onChange={(e) => field.onChange(maskNumber(e.target.value, 14))} />
									</div>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="otherCosts"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Outros Custos (Opcional)</FormLabel>
								<FormControl>
									<div className="relative">
										<DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
										<Input type="text" placeholder="0,00" className="pl-9" {...field} onChange={(e) => field.onChange(maskNumber(e.target.value, 14))} />
									</div>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<div className="space-y-4">
						<h4 className="font-medium">Valores de Serviços por Prazo</h4>

						<FormItem>
							<FormLabel>Serviços (36 meses)</FormLabel>
							<FormControl>
								<div className="relative">
									<DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
									<Input type="text" className="pl-9" value={formattedServicesValue36} disabled />
								</div>
							</FormControl>
						</FormItem>

						<FormItem>
							<FormLabel>Serviços (48 meses)</FormLabel>
							<FormControl>
								<div className="relative">
									<DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
									<Input type="text" className="pl-9" value={formattedServicesValue48} disabled />
								</div>
							</FormControl>
						</FormItem>

						<FormItem>
							<FormLabel>Serviços (60 meses)</FormLabel>
							<FormControl>
								<div className="relative">
									<DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
									<Input type="text" className="pl-9" value={formattedServicesValue60} disabled />
								</div>
							</FormControl>
						</FormItem>
					</div>

					<FormField
						control={form.control}
						name="notes"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-[#1d9bf0]">Observações</FormLabel>
								<FormControl>
									<Textarea
										className="border-[#1d9bf0]"
										placeholder={"Documentação: Preencher com DRE da empresa\n\n" + "Reprovação por protestos: Preencher apenas alguns dias depois"}
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
				<div className="w-full space-y-6">
					<Card className="shadow-lg border-2 hover:shadow-xl transition-shadow">
						<CardHeader className="pb-4">
							<div className="flex items-center justify-between">
								<CardTitle className="text-xl">Plano 36 meses</CardTitle>
								<div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">Curto Prazo</div>
							</div>
							<CardDescription>Taxa de juros e serviços aplicados para 36 meses</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							{!isEditing && isLoadingRates ? (
								<div className="space-y-4">
									<Skeleton className="h-24 w-full rounded-xl" />
									<Skeleton className="h-20 w-full rounded-lg" />
								</div>
							) : (
								<>
									<div className="flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 p-6 border-2 border-primary/20">
										<span className="text-sm font-medium text-muted-foreground mb-1">Total do Investimento</span>
										<span className="font-bold text-4xl text-primary">{formattedTotalInvestment36}</span>
									</div>
									<div className="rounded-lg bg-muted/50 p-5 border">
										<div className="flex items-center justify-between mb-3">
											<h4 className="font-semibold text-base">Parcelamento</h4>
										</div>
										{installmentTerms
											.filter((term) => term === 36)
											.map((term, index) => {
												const installment = calculateInstallmentPayment({
													rate: interestRate36,
													numberOfPeriods: term,
													presentValue: totalInvestment36
												})
												return (
													<div key={`${term}-${index}`} className="flex items-center justify-between p-3 rounded-lg bg-background border">
														<span className="text-sm font-medium text-muted-foreground">{term} parcelas de</span>
														<span className="font-bold text-lg">{formatCurrency(installment)}</span>
													</div>
												)
											})}
									</div>
								</>
							)}
						</CardContent>
					</Card>

					<Card className="shadow-lg border-2 hover:shadow-xl transition-shadow">
						<CardHeader className="pb-4">
							<div className="flex items-center justify-between">
								<CardTitle className="text-xl">Plano 48 meses</CardTitle>
								<div className="px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-xs font-semibold">Médio Prazo</div>
							</div>
							<CardDescription>Taxa de juros e serviços aplicados para 48 meses</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							{!isEditing && isLoadingRates ? (
								<div className="space-y-4">
									<Skeleton className="h-24 w-full rounded-xl" />
									<Skeleton className="h-20 w-full rounded-lg" />
								</div>
							) : (
								<>
									<div className="flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-6 border-2 border-blue-500/20">
										<span className="text-sm font-medium text-muted-foreground mb-1">Total do Investimento</span>
										<span className="font-bold text-4xl text-blue-600 dark:text-blue-400">{formattedTotalInvestment48}</span>
									</div>
									<div className="rounded-lg bg-muted/50 p-5 border">
										<div className="flex items-center justify-between mb-3">
											<h4 className="font-semibold text-base">Parcelamento</h4>
										</div>
										{installmentTerms
											.filter((term) => term === 48)
											.map((term, index) => {
												const installment = calculateInstallmentPayment({
													rate: interestRate48,
													numberOfPeriods: term,
													presentValue: totalInvestment48
												})
												return (
													<div key={`${term}-${index}`} className="flex items-center justify-between p-3 rounded-lg bg-background border">
														<span className="text-sm font-medium text-muted-foreground">{term} parcelas de</span>
														<span className="font-bold text-lg">{formatCurrency(installment)}</span>
													</div>
												)
											})}
									</div>
								</>
							)}
						</CardContent>
					</Card>

					<Card className="shadow-lg border-2 hover:shadow-xl transition-shadow">
						<CardHeader className="pb-4">
							<div className="flex items-center justify-between">
								<CardTitle className="text-xl">Plano 60 meses</CardTitle>
								<div className="px-3 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-xs font-semibold">Longo Prazo</div>
							</div>
							<CardDescription>Taxa de juros e serviços aplicados para 60 meses</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							{!isEditing && isLoadingRates ? (
								<div className="space-y-4">
									<Skeleton className="h-24 w-full rounded-xl" />
									<Skeleton className="h-20 w-full rounded-lg" />
								</div>
							) : (
								<>
									<div className="flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 p-6 border-2 border-green-500/20">
										<span className="text-sm font-medium text-muted-foreground mb-1">Total do Investimento</span>
										<span className="font-bold text-4xl text-green-600 dark:text-green-400">{formattedTotalInvestment60}</span>
									</div>
									<div className="rounded-lg bg-muted/50 p-5 border">
										<div className="flex items-center justify-between mb-3">
											<h4 className="font-semibold text-base">Parcelamento</h4>
										</div>
										{installmentTerms
											.filter((term) => term === 60)
											.map((term, index) => {
												const installment = calculateInstallmentPayment({
													rate: interestRate60,
													numberOfPeriods: term,
													presentValue: totalInvestment60
												})
												return (
													<div key={`${term}-${index}`} className="flex items-center justify-between p-3 rounded-lg bg-background border">
														<span className="text-sm font-medium text-muted-foreground">{term} parcelas de</span>
														<span className="font-bold text-lg">{formatCurrency(installment)}</span>
													</div>
												)
											})}
									</div>
								</>
							)}
						</CardContent>
					</Card>
				</div>
			</div>

			<div className="flex justify-between pt-8">
				<Button type="button" variant="outline" onClick={onBack}>
					<ArrowLeft className="mr-2 h-4 w-4" /> Voltar
				</Button>
				<Button type="button" onClick={onNext} disabled={form.formState.isSubmitting}>
					Próximo <ArrowRight className="ml-2 h-4 w-4" />
				</Button>
			</div>
		</form>
	)
}

export { SimulationStep4 }
