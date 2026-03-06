"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { ArrowLeft, ArrowRight, Loader2, Save } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { getCustomerById, updateCustomer } from "@/actions/customers"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { brazilianStates } from "@/lib/constants"
import { maskCep, maskCnpj, maskCpf, maskDate, maskNumber, maskPhone } from "@/lib/masks"
import { cn } from "@/lib/utils"
import { type CustomerSchema, editCustomerSchema, getCustomerSchema } from "@/lib/validations/customer"

interface EditCustomerFormProps {
	customerId: string
	onFinished: () => void
}

function FormSkeleton() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-10 w-full" />
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
			</div>
			<Skeleton className="h-10 w-full" />
		</div>
	)
}

function EditCustomerFormContent({
	customerId,
	onFinished,
	initialData
}: EditCustomerFormProps & { initialData: Partial<CustomerSchema> & { type: "pf" | "pj" } }) {
	const [step, setStep] = useState(1)
	const [isFetchingCep, setIsFetchingCep] = useState(false)
	const [customerType, setCustomerType] = useState<"pf" | "pj">(initialData.type || "pf")
	const queryClient = useQueryClient()

	const form = useForm<CustomerSchema>({
		resolver: zodResolver(getCustomerSchema(customerType)),
		defaultValues: {
			...initialData,
			type: customerType
		},
		mode: "onBlur"
	})

	const { control, handleSubmit, formState, setValue, setFocus, trigger, resetField, watch } = form

	// Resetar validação e campos ao mudar tipo
	useEffect(() => {
		form.setValue("type", customerType)
		if (customerType === "pf") {
			resetField("cnpj")
			resetField("ie")
			resetField("company_name")
		} else {
			resetField("cpf")
			resetField("rg")
			resetField("name")
		}
		// Dispara validação apenas se o formulário já tiver sido tocado, para evitar erros imediatos
		if (formState.isDirty) {
			trigger()
		}
	}, [customerType, form, resetField, trigger, formState.isDirty])

	async function handleCepBlur(e: React.FocusEvent<HTMLInputElement>) {
		const cep = e.target.value.replace(/\D/g, "")
		if (cep.length !== 8) return

		setIsFetchingCep(true)
		try {
			const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
			const data = await response.json()
			if (data.erro) {
				toast.error("CEP não encontrado")
				return
			}
			setValue("street", data.logradouro, { shouldValidate: true })
			setValue("neighborhood", data.bairro, { shouldValidate: true })
			setValue("city", data.localidade, { shouldValidate: true })
			setValue("state", data.uf, { shouldValidate: true })
			setFocus("number")
		} catch (error) {
			console.error("Falha ao buscar CEP:", error)
			toast.error("Erro ao buscar CEP")
		} finally {
			setIsFetchingCep(false)
		}
	}

	const nextStep = async (e?: React.MouseEvent) => {
		e?.preventDefault()
		let fieldsToValidate: (keyof CustomerSchema)[] = []
		if (step === 1) {
			if (customerType === "pj") {
				fieldsToValidate = ["company_name", "cnpj", "incorporation_date", "annual_revenue"]
			} else {
				fieldsToValidate = ["name", "cpf", "incorporation_date", "annual_revenue"]
			}
		} else if (step === 2) {
			fieldsToValidate = ["contact_name", "contact_phone", "contact_email"]
		}

		// @ts-ignore - Trigger validation on subset
		const isValid = await trigger(fieldsToValidate, { shouldFocus: true })
		if (isValid) setStep((prev) => prev + 1)
	}

	async function onSubmit(formData: CustomerSchema) {
		try {
			// Parse final data safely
			const parsedData = editCustomerSchema.parse(formData)
			const result = await updateCustomer(customerId, parsedData)

			if (result.success) {
				toast.success(result.message)
				queryClient.invalidateQueries({ queryKey: ["customers"] })
				onFinished()
			} else {
				toast.error("Erro na atualização", { description: result.message })
			}
		} catch (error) {
			console.error(error)
			toast.error("Erro ao processar dados")
		}
	}

	const motionVariants = {
		initial: { opacity: 0, x: -50 },
		animate: { opacity: 1, x: 0 },
		exit: { opacity: 0, x: 50 }
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && step < 3) {
			e.preventDefault()
			nextStep()
		}
	}

	return (
		<Card className="w-full border-0 shadow-none">
			<CardHeader>
				{/* Stepper Visual */}
				<div className="flex w-full items-start pt-6">
					{[1, 2, 3].map((s) => (
						<div key={s} className="flex flex-1 flex-col items-center">
							<div
								className={cn(
									"flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold transition-all",
									step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
								)}
							>
								{s}
							</div>
							<p className={cn("mt-2 text-sm font-medium", step >= s ? "text-primary" : "text-muted-foreground")}>
								{s === 1 ? "Dados" : s === 2 ? "Contato" : "Endereço"}
							</p>
						</div>
					))}
				</div>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form onSubmit={handleSubmit(onSubmit)} onKeyDown={handleKeyDown} className="space-y-6">
						<motion.div
							key={step}
							variants={motionVariants}
							initial="initial"
							animate="animate"
							exit="exit"
							transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
						>
							{/* STEP 1: DADOS GERAIS */}
							{step === 1 && (
								<div className="space-y-6">
									<div className="flex justify-center mb-6">
										<RadioGroup value={customerType} onValueChange={(v) => setCustomerType(v as "pf" | "pj")} className="flex gap-4">
											<div className="flex items-center space-x-2">
												<RadioGroupItem value="pf" id="pf" />
												<Label htmlFor="pf">Pessoa Física</Label>
											</div>
											<div className="flex items-center space-x-2">
												<RadioGroupItem value="pj" id="pj" />
												<Label htmlFor="pj">Pessoa Jurídica</Label>
											</div>
										</RadioGroup>
									</div>

									<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
										{customerType === "pj" ? (
											<>
												<FormField
													control={control}
													name="cnpj"
													render={({ field }) => (
														<FormItem>
															<FormLabel>CNPJ</FormLabel>
															<FormControl>
																<Input placeholder="00.000.000/0000-00" {...field} onChange={(e) => field.onChange(maskCnpj(e.target.value))} />
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
												<FormField
													control={control}
													name="company_name"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Razão Social</FormLabel>
															<FormControl>
																<Input placeholder="Empresa LTDA" {...field} />
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
												<FormField
													control={control}
													name="ie"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Inscrição Estadual (Opcional)</FormLabel>
															<FormControl>
																<Input {...field} />
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
											</>
										) : (
											<>
												<FormField
													control={control}
													name="cpf"
													render={({ field }) => (
														<FormItem>
															<FormLabel>CPF</FormLabel>
															<FormControl>
																<Input placeholder="000.000.000-00" {...field} onChange={(e) => field.onChange(maskCpf(e.target.value))} />
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
												<FormField
													control={control}
													name="name"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Nome Completo</FormLabel>
															<FormControl>
																<Input placeholder="Nome do Cliente" {...field} />
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
												<FormField
													control={control}
													name="rg"
													render={({ field }) => (
														<FormItem>
															<FormLabel>RG (Opcional)</FormLabel>
															<FormControl>
																<Input {...field} />
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
											</>
										)}
									</div>

									<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
										<FormField
											control={control}
											name="incorporation_date"
											render={({ field }) => (
												<FormItem>
													<FormLabel>{customerType === "pj" ? "Data de Fundação" : "Data de Nascimento (Opcional)"}</FormLabel>
													<FormControl>
														<Input placeholder="DD/MM/AAAA" {...field} value={field.value || ""} onChange={(e) => field.onChange(maskDate(e.target.value))} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={control}
											name="annual_revenue"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Faturamento/Renda Mensal (Opcional)</FormLabel>
													<FormControl>
														<div className="relative">
															<span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground">R$</span>
															<Input
																placeholder="0,00"
																className="pl-9"
																{...field}
																value={field.value || ""}
																onChange={(e) => field.onChange(maskNumber(e.target.value, 15))}
															/>
														</div>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
								</div>
							)}

							{/* STEP 2: CONTATO */}
							{step === 2 && (
								<div className="space-y-6">
									<FormField
										control={control}
										name="contact_name"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Nome do Responsável</FormLabel>
												<FormControl>
													<Input placeholder="João da Silva" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
										<FormField
											control={control}
											name="contact_phone"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Celular</FormLabel>
													<FormControl>
														<Input placeholder="(11) 99999-9999" {...field} onChange={(e) => field.onChange(maskPhone(e.target.value))} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={control}
											name="contact_email"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Email</FormLabel>
													<FormControl>
														<Input placeholder="email@exemplo.com" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
								</div>
							)}

							{/* STEP 3: ENDEREÇO */}
							{step === 3 && (
								<div className="space-y-6">
									<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
										<FormField
											control={control}
											name="postal_code"
											render={({ field }) => (
												<FormItem className="md:col-span-1">
													<FormLabel>CEP</FormLabel>
													<FormControl>
														<div className="relative">
															<Input placeholder="00000-000" {...field} onChange={(e) => field.onChange(maskCep(e.target.value))} onBlur={handleCepBlur} />
															{isFetchingCep && <Loader2 className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin" />}
														</div>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={control}
											name="street"
											render={({ field }) => (
												<FormItem className="md:col-span-2">
													<FormLabel>Rua</FormLabel>
													<FormControl>
														<Input placeholder="Rua Exemplo" {...field} disabled={isFetchingCep} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
									<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
										<FormField
											control={control}
											name="number"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Número</FormLabel>
													<FormControl>
														<Input placeholder="123" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={control}
											name="complement"
											render={({ field }) => (
												<FormItem className="md:col-span-2">
													<FormLabel>Complemento</FormLabel>
													<FormControl>
														<Input placeholder="Apto, Bloco..." {...field} value={field.value || ""} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
									<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
										<FormField
											control={control}
											name="neighborhood"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Bairro</FormLabel>
													<FormControl>
														<Input placeholder="Bairro" {...field} disabled={isFetchingCep} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={control}
											name="city"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Cidade</FormLabel>
													<FormControl>
														<Input placeholder="Cidade" {...field} disabled={isFetchingCep} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={control}
											name="state"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Estado</FormLabel>
													<Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={isFetchingCep}>
														<FormControl>
															<SelectTrigger>
																<SelectValue placeholder="UF">{field.value}</SelectValue>
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															{brazilianStates.map((state) => (
																<SelectItem key={state.value} value={state.value}>
																	{state.label}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
								</div>
							)}
						</motion.div>

						<div className="flex justify-between pt-4">
							{step > 1 ? (
								<Button type="button" variant="outline" onClick={() => setStep((p) => p - 1)}>
									<ArrowLeft className="mr-2 h-4 w-4" /> Voltar
								</Button>
							) : (
								<div />
							)}
							{step < 3 ? (
								<Button type="button" onClick={nextStep}>
									Próximo <ArrowRight className="ml-2 h-4 w-4" />
								</Button>
							) : (
								<Button type="submit" disabled={formState.isSubmitting}>
									{formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
									Salvar Alterações
								</Button>
							)}
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	)
}

export function EditCustomerForm({ customerId, onFinished }: EditCustomerFormProps) {
	const {
		data: queryData,
		isLoading,
		error
	} = useQuery({
		queryKey: ["customer-details", customerId],
		queryFn: () => getCustomerById(customerId),
		staleTime: 5 * 60 * 1000,
		refetchOnWindowFocus: false,
		enabled: !!customerId
	})

	if (isLoading) return <FormSkeleton />

	if (error || !queryData?.success || !queryData.data) {
		return <p className="text-center text-destructive">Erro ao carregar os dados do cliente.</p>
	}

	const customer = queryData.data

	// Mapeia dados do banco para o formato do form
	// Infere tipo baseado na presença de CNPJ
	const isPj = !!customer.cnpj
	const initialType = isPj ? "pj" : "pf"

	const initialData = {
		type: initialType,
		// Comuns
		contact_name: customer.contact_name,
		contact_phone: maskPhone(customer.contact_phone),
		contact_email: customer.contact_email,
		postal_code: maskCep(customer.postal_code),
		street: customer.street,
		number: customer.number,
		complement: customer.complement || undefined,
		neighborhood: customer.neighborhood,
		city: customer.city,
		state: customer.state,
		annual_revenue: customer.annual_revenue ? maskNumber(customer.annual_revenue.toString(), 15) : undefined,
		incorporation_date: customer.incorporation_date ? maskDate(customer.incorporation_date.split("-").reverse().join("")) : undefined,
		// PJ
		cnpj: customer.cnpj ? maskCnpj(customer.cnpj) : undefined,
		company_name: customer.company_name,
		ie: undefined, // Campo que talvez não venha do banco ainda
		// PF
		cpf: undefined, // Se tivesse no banco, mapearia aqui
		name: customer.company_name, // Usando company_name como nome para PF provisoriamente se não houver campo 'name' na tabela original
		rg: undefined
	} as any

	return <EditCustomerFormContent customerId={customerId} onFinished={onFinished} initialData={initialData} />
}
