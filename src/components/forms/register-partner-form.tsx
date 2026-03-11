"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, ArrowRight, Building2, Eye, EyeOff, Loader2, Lock, Mail, MapPin, UserPlus } from "lucide-react"
import { motion } from "motion/react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useOperationFeedback } from "@/components/feedback/operation-feedback"

import { registerPartner } from "@/actions/partners"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { brazilianStates } from "@/lib/constants"
import { maskCep, maskCnpj, maskPhone } from "@/lib/masks"
import { cn } from "@/lib/utils"
import { type RegisterPartnerData, registerPartnerSchema } from "@/lib/validations/partner"

const RegisterPartnerForm = ({ className }: { className?: string }) => {
	const [step, setStep] = useState(1)
	const [isFetchingCep, setIsFetchingCep] = useState(false)
	const [isFetchingCnpj, setIsFetchingCnpj] = useState(false)
	const [showPassword, setShowPassword] = useState(false)
	const [showConfirmPassword, setShowConfirmPassword] = useState(false)
	const queryClient = useQueryClient()
	const { execute } = useOperationFeedback()

	const registerPartnerForm = useForm<RegisterPartnerData>({
		resolver: zodResolver(registerPartnerSchema),
		defaultValues: {
			cnpj: "",
			legalBusinessName: "",
			contactName: "",
			contactMobile: "",
			contactEmail: "",
			cep: "",
			street: "",
			number: "",
			complement: "",
			neighborhood: "",
			city: "",
			state: "",
			confirmEmail: "",
			password: "",
			confirmPassword: ""
		}
	})

	const { control, handleSubmit, formState, setValue, setFocus, trigger, reset, resetField } = registerPartnerForm

	async function handleCnpjBlur(e: React.FocusEvent<HTMLInputElement>) {
		const cnpj = e.target.value.replace(/\D/g, "")
		if (cnpj.length !== 14) {
			return
		}

		setIsFetchingCnpj(true)
		try {
			const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`)
			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.message || "CNPJ não encontrado ou inválido.")
			}

			setValue("legalBusinessName", data.razao_social || "", { shouldValidate: true })
			setFocus("contactName")
		} catch (error) {
			console.error("Falha ao buscar CNPJ:", error)
			const errorMessage = error instanceof Error ? error.message : "Não foi possível buscar os dados do CNPJ."
			toast.error("Erro ao buscar CNPJ", {
				description: errorMessage
			})
			setValue("legalBusinessName", "")
		} finally {
			setIsFetchingCnpj(false)
		}
	}

	async function handleCepBlur(e: React.FocusEvent<HTMLInputElement>) {
		const cep = e.target.value.replace(/\D/g, "")
		if (cep.length !== 8) {
			return
		}
		setIsFetchingCep(true)
		try {
			const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
			const data = await response.json()
			if (data.erro) {
				toast.error("CEP não encontrado", {
					description: "Por favor, verifique o CEP digitado."
				})
				resetField("street")
				resetField("neighborhood")
				resetField("city")
				resetField("state")
				return
			}
			setValue("street", data.logradouro, { shouldValidate: true })
			setValue("neighborhood", data.bairro, { shouldValidate: true })
			setValue("city", data.localidade, { shouldValidate: true })
			setValue("state", data.uf, { shouldValidate: true })
			setFocus("number")
		} catch (error) {
			console.error("Falha ao buscar CEP:", error)
			toast.error("Erro ao buscar CEP", {
				description: "Não foi possível buscar os dados do endereço. Tente novamente."
			})
		} finally {
			setIsFetchingCep(false)
		}
	}

	const prevStep = () => setStep((prev) => prev - 1)

	async function nextStep(currentStep: number) {
		let fieldsToValidate: (keyof RegisterPartnerData)[] = []
		if (currentStep === 1) {
			fieldsToValidate = ["cnpj", "legalBusinessName", "contactName", "contactMobile"]
		} else if (currentStep === 2) {
			fieldsToValidate = ["cep", "street", "number", "neighborhood", "city", "state"]
		}

		const output = await trigger(fieldsToValidate, { shouldFocus: true })
		if (output) {
			setStep(currentStep + 1)
		}
	}

	function onSubmit(data: RegisterPartnerData) {
		execute({
			action: () => registerPartner(data),
			loadingMessage: "Enviando cadastro...",
			successMessage: "Cadastro realizado com sucesso! Seu cadastro foi enviado para análise.",
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ["partners"] })
				queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
				reset()
				setStep(1)
			}
		})
	}

	const motionVariants = {
		initial: { opacity: 0, x: -50 },
		animate: { opacity: 1, x: 0 },
		exit: { opacity: 0, x: 50 }
	}

	const stepIcons = [
		{ icon: Building2, label: "Empresa", color: "from-meo-blue to-meo-blue-dark" },
		{ icon: MapPin, label: "Endereço", color: "from-meo-green to-emerald-600" },
		{ icon: Lock, label: "Cadastro", color: "from-meo-cyan to-teal-600" }
	]

	const inputClasses = "h-11 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white transition-colors text-sm"

	return (
		<div className={cn("w-full", className)}>
			{/* Step indicator */}
			<div className="px-6 pt-6 pb-2">
				<div className="flex w-full items-start">
					{stepIcons.map((stepItem, index) => {
						const StepIcon = stepItem.icon
						const stepNum = index + 1
						const isActive = step >= stepNum
						return (
							<div key={stepNum} className="flex flex-1 items-center">
								<div className="flex flex-col items-center flex-1">
									<div
										className={cn(
											"flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold transition-all duration-300",
											isActive
												? `bg-gradient-to-br ${stepItem.color} text-white shadow-lg`
												: "bg-gray-100 text-meo-gray-light"
										)}
									>
										<StepIcon className="w-5 h-5" />
									</div>
									<p
										className={cn(
											"mt-2 text-xs font-medium transition-colors",
											isActive ? "text-meo-navy" : "text-meo-gray-light"
										)}
									>
										{stepItem.label}
									</p>
								</div>
								{stepNum < 3 && (
									<div
										className={cn(
											"h-0.5 flex-1 -mt-5 mx-1 rounded-full transition-colors duration-300",
											step > stepNum ? "bg-gradient-to-r from-meo-blue to-meo-green" : "bg-gray-200"
										)}
									/>
								)}
							</div>
						)
					})}
				</div>
			</div>

			{/* Form content */}
			<div className="px-6 pb-6">
				<Form {...registerPartnerForm}>
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
						<motion.div
							key={step}
							variants={motionVariants}
							initial="initial"
							animate="animate"
							exit="exit"
							transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
						>
							{step === 1 && (
								<div className="space-y-4">
									<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
										<FormField
											control={control}
											name="cnpj"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-meo-gray font-medium text-sm">CNPJ</FormLabel>
													<FormControl>
														<div className="relative meo-input-glow rounded-xl transition-all">
															<Input
																placeholder="00.000.000/0000-00"
																className={inputClasses}
																{...field}
																onChange={(e) => field.onChange(maskCnpj(e.target.value))}
																onBlur={handleCnpjBlur}
															/>
															{isFetchingCnpj && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-meo-blue" />}
														</div>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={control}
											name="legalBusinessName"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-meo-gray font-medium text-sm">Razão Social</FormLabel>
													<FormControl>
														<Input placeholder="Preenchido automaticamente" className={cn(inputClasses, "bg-gray-100/80")} {...field} disabled />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
									<FormField
										control={control}
										name="contactName"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-meo-gray font-medium text-sm">Nome do Responsável</FormLabel>
												<FormControl>
													<Input placeholder="João da Silva" className={inputClasses} {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={control}
										name="contactMobile"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-meo-gray font-medium text-sm">Celular do Responsável</FormLabel>
												<FormControl>
													<Input placeholder="(11) 99999-9999" className={inputClasses} {...field} onChange={(e) => field.onChange(maskPhone(e.target.value))} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							)}

							{step === 2 && (
								<div className="space-y-4">
									<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
										<FormField
											control={control}
											name="cep"
											render={({ field }) => (
												<FormItem className="md:col-span-1">
													<FormLabel className="text-meo-gray font-medium text-sm">CEP</FormLabel>
													<FormControl>
														<div className="relative meo-input-glow rounded-xl transition-all">
															<Input placeholder="00000-000" className={inputClasses} {...field} onChange={(e) => field.onChange(maskCep(e.target.value))} onBlur={handleCepBlur} />
															{isFetchingCep && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-meo-blue" />}
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
													<FormLabel className="text-meo-gray font-medium text-sm">Rua</FormLabel>
													<FormControl>
														<Input placeholder="Avenida Paulista" className={inputClasses} {...field} disabled={isFetchingCep} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
									<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
										<FormField
											control={control}
											name="number"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-meo-gray font-medium text-sm">Número</FormLabel>
													<FormControl>
														<Input placeholder="123" className={inputClasses} {...field} />
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
													<FormLabel className="text-meo-gray font-medium text-sm">Complemento (Opcional)</FormLabel>
													<FormControl>
														<Input placeholder="Apto 101, Bloco B" className={inputClasses} {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
									<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
										<FormField
											control={control}
											name="neighborhood"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-meo-gray font-medium text-sm">Bairro</FormLabel>
													<FormControl>
														<Input placeholder="Bela Vista" className={inputClasses} {...field} disabled={isFetchingCep} />
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
													<FormLabel className="text-meo-gray font-medium text-sm">Cidade</FormLabel>
													<FormControl>
														<Input placeholder="São Paulo" className={inputClasses} {...field} disabled={isFetchingCep} />
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
													<FormLabel className="text-meo-gray font-medium text-sm">Estado</FormLabel>
													<Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={isFetchingCep}>
														<FormControl>
															<SelectTrigger className={inputClasses}>
																<SelectValue placeholder="Selecione">{field.value}</SelectValue>
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

							{step === 3 && (
								<div className="space-y-4">
									<FormField
										control={control}
										name="contactEmail"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-meo-gray font-medium text-sm">Email do Responsável</FormLabel>
												<FormControl>
													<div className="relative meo-input-glow rounded-xl transition-all">
														<Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-meo-gray-light" />
														<Input placeholder="contato@suaempresa.com" className={cn(inputClasses, "pl-10")} {...field} />
													</div>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={control}
										name="confirmEmail"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-meo-gray font-medium text-sm">Confirmar Email</FormLabel>
												<FormControl>
													<div className="relative meo-input-glow rounded-xl transition-all">
														<Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-meo-gray-light" />
														<Input type="email" placeholder="confirme.contato@suaempresa.com" className={cn(inputClasses, "pl-10")} {...field} />
													</div>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={control}
										name="password"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-meo-gray font-medium text-sm">Senha</FormLabel>
												<FormControl>
													<div className="relative meo-input-glow rounded-xl transition-all">
														<Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-meo-gray-light" />
														<Input
															type={showPassword ? "text" : "password"}
															placeholder="Mínimo 8 caracteres"
															className={cn(inputClasses, "pl-10 pr-10")}
															{...field}
														/>
														<button
															type="button"
															onClick={() => setShowPassword(!showPassword)}
															className="absolute right-3.5 top-1/2 -translate-y-1/2 text-meo-gray-light hover:text-meo-gray transition-colors"
															tabIndex={-1}
														>
															{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
														</button>
													</div>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={control}
										name="confirmPassword"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-meo-gray font-medium text-sm">Confirmar Senha</FormLabel>
												<FormControl>
													<div className="relative meo-input-glow rounded-xl transition-all">
														<Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-meo-gray-light" />
														<Input
															type={showConfirmPassword ? "text" : "password"}
															placeholder="Repita a senha"
															className={cn(inputClasses, "pl-10 pr-10")}
															{...field}
														/>
														<button
															type="button"
															onClick={() => setShowConfirmPassword(!showConfirmPassword)}
															className="absolute right-3.5 top-1/2 -translate-y-1/2 text-meo-gray-light hover:text-meo-gray transition-colors"
															tabIndex={-1}
														>
															{showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
														</button>
													</div>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							)}
						</motion.div>

						<div className="flex justify-between pt-2">
							{step > 1 && (
								<Button
									type="button"
									variant="outline"
									onClick={prevStep}
									className="h-11 rounded-xl border-gray-200 text-meo-gray hover:bg-gray-50 transition-all"
								>
									<ArrowLeft className="mr-2 h-4 w-4" /> Voltar
								</Button>
							)}
							{step < 3 && (
								<Button
									type="button"
									onClick={() => nextStep(step)}
									className={cn(
										"h-11 rounded-xl meo-btn-gradient text-white border-0 font-semibold",
										step === 1 && "w-full"
									)}
								>
									Próximo <ArrowRight className="ml-2 h-4 w-4" />
								</Button>
							)}
							{step === 3 && (
								<Button
									type="submit"
									disabled={formState.isSubmitting}
									className="h-11 rounded-xl meo-btn-gradient text-white border-0 font-semibold"
								>
									{formState.isSubmitting ? (
										<div className="flex items-center gap-2">
											<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
											<span>Cadastrando...</span>
										</div>
									) : (
										<>
											<UserPlus className="mr-2 h-4 w-4" />
											Cadastrar
										</>
									)}
								</Button>
							)}
						</div>
					</form>
				</Form>
			</div>
		</div>
	)
}

export { RegisterPartnerForm }
