"use client"

import { ArrowLeft, ArrowRight, Loader2, X } from "lucide-react"
import { useState } from "react"
import { useFormContext } from "react-hook-form"
import { toast } from "sonner"

import { getCustomerByCnpj } from "@/actions/customers"
import { Button } from "@/components/ui/button"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useSimulation } from "@/contexts/simulation-context"
import { maskCep, maskCnpj, maskCpf, maskDate, maskNumber, maskPhone } from "@/lib/masks"

interface Step2Props {
	onNext: () => void
	onBack: () => void
}

const SimulationStep2 = ({ onNext, onBack }: Step2Props) => {
	const form = useFormContext()
	const { setValue, setFocus, trigger, watch, resetField, clearErrors } = form
	const [isFetchingCnpj, setIsFetchingCnpj] = useState<boolean>(false)

	const { isCustomerDataLocked, setIsCustomerDataLocked } = useSimulation()

	const cnpjValue = watch("cnpj")
	const type = watch("type")

	const fieldsToClear = ["legalName", "incorporationDate", "annualRevenue", "contactName", "contactPhone", "contactEmail"] as const

	const clearCnpjRelatedFields = () => {
		fieldsToClear.forEach((field) => resetField(field, { defaultValue: "" }))
		// Clear address fields
		setValue("cep", "")
		setValue("street", "")
		setValue("number", "")
		setValue("complement", "")
		setValue("neighborhood", "")
		setValue("city", "")
		setValue("state", "")

		setIsCustomerDataLocked(false)
	}

	function handleClearCnpj() {
		setValue("cnpj", "")
		clearCnpjRelatedFields()
		setFocus("cnpj")
	}

	function handleTypeChange(value: "pf" | "pj") {
		setValue("type", value)
		clearErrors()
		setIsCustomerDataLocked(false)

		if (value === "pf") {
			resetField("cnpj")
			resetField("legalName")
			resetField("incorporationDate")
			resetField("annualRevenue")
		} else {
			resetField("cpf")
			resetField("name")
		}
	}

	async function handleCnpjBlur(e: React.FocusEvent<HTMLInputElement>) {
		const cnpj = e.target.value
		if (cnpj.length !== 18) {
			// 18 é o comprimento do CNPJ com máscara
			if (cnpj.length === 0) clearCnpjRelatedFields()
			return
		}

		setIsFetchingCnpj(true)
		clearCnpjRelatedFields()

		// Passo 1: Tenta buscar o cliente no nosso banco de dados primeiro
		const existingCustomerResponse = await getCustomerByCnpj(cnpj)

		if (existingCustomerResponse.success) {
			if (existingCustomerResponse.data) {
				// Cliente encontrado! Preenche e trava os campos.
				const customer = existingCustomerResponse.data
				setValue("legalName", customer.company_name, { shouldValidate: true })
				setValue("incorporationDate", customer.incorporation_date ? maskDate(customer.incorporation_date.split("-").reverse().join("")) : "", {
					shouldValidate: true
				})
				setValue("annualRevenue", customer.annual_revenue ? maskNumber(String(customer.annual_revenue), 15) : "", { shouldValidate: true })
				setValue("contactName", customer.contact_name, { shouldValidate: true })
				setValue("contactPhone", maskPhone(customer.contact_phone), { shouldValidate: true })
				setValue("contactEmail", customer.contact_email, { shouldValidate: true })
				setValue("cep", maskCep(customer.postal_code), { shouldValidate: true })
				setValue("street", customer.street, { shouldValidate: true })
				setValue("number", customer.number, { shouldValidate: true })
				setValue("complement", customer.complement || "", { shouldValidate: true })
				setValue("neighborhood", customer.neighborhood, { shouldValidate: true })
				setValue("city", customer.city, { shouldValidate: true })
				setValue("state", customer.state, { shouldValidate: true })

				setIsCustomerDataLocked(true)
				toast.info("Cliente já cadastrado", {
					description: "Os dados foram preenchidos. Para alterá-los, acesse a tela de Clientes."
				})
			} else {
				// Cliente não encontrado, busca na API externa
				try {
					const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj.replace(/\D/g, "")}`)
					if (!response.ok) {
						const errorData = await response.json().catch(() => null)
						const errorMessage = errorData?.message || "CNPJ não encontrado ou inválido."
						throw new Error(errorMessage)
					}
					const data = await response.json()
					setValue("legalName", data.razao_social || "", { shouldValidate: true })
					setValue("incorporationDate", data.data_inicio_atividade ? maskDate(data.data_inicio_atividade.split("-").reverse().join("")) : "", {
						shouldValidate: true
					})
					setValue("cep", data.cep ? maskCep(data.cep.toString()) : "")
					setValue("street", data.logradouro || "")
					setValue("number", data.numero || "")
					setValue("complement", data.complemento || "")
					setValue("neighborhood", data.bairro || "")
					setValue("city", data.municipio || "")
					setValue("state", data.uf || "")
					toast.success("Dados do CNPJ preenchidos.")
					trigger(["legalName", "incorporationDate"])
					setFocus("annualRevenue")
				} catch (error) {
					console.error("Falha ao buscar CNPJ:", error)
					const errorMessage = error instanceof Error ? error.message : "Não foi possível buscar os dados. Tente novamente."
					toast.error("Erro ao buscar CNPJ", {
						description: errorMessage
					})
				}
			}
		} else {
			// A própria action getCustomerByCnpj falhou
			toast.error("Erro na consulta", { description: existingCustomerResponse.message })
		}

		setIsFetchingCnpj(false)
	}

	return (
		<form className="space-y-6">
			<h3 className="text-lg font-medium">Passo 2: Dados do Cliente</h3>

			<FormField
				control={form.control}
				name="type"
				render={({ field }) => (
					<FormItem className="space-y-1">
						<FormLabel>Tipo de Pessoa</FormLabel>
						<FormControl>
							<RadioGroup
								onValueChange={handleTypeChange}
								defaultValue={field.value}
								className="flex flex-row space-x-4"
							>
								<FormItem className="flex items-center space-x-2 space-y-0">
									<FormControl>
										<RadioGroupItem value="pj" />
									</FormControl>
									<FormLabel className="font-normal">Pessoa Jurídica</FormLabel>
								</FormItem>
								<FormItem className="flex items-center space-x-2 space-y-0">
									<FormControl>
										<RadioGroupItem value="pf" />
									</FormControl>
									<FormLabel className="font-normal">Pessoa Física</FormLabel>
								</FormItem>
							</RadioGroup>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			<div className="space-y-6">
				{type === "pj" ? (
					<>
						<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
							<FormField
								control={form.control}
								name="cnpj"
								render={({ field }) => (
									<FormItem>
										<FormLabel>CNPJ *</FormLabel>
										<FormControl>
											<div className="relative">
												<Input
													placeholder="00.000.000/0000-00"
													{...field}
													onChange={(e) => {
														field.onChange(maskCnpj(e.target.value))
													}}
													onBlur={handleCnpjBlur}
													disabled={isFetchingCnpj}
												/>
												{isFetchingCnpj && <Loader2 className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin" />}
												{!isFetchingCnpj && cnpjValue && (
													<Button
														type="button"
														variant="ghost"
														size="icon"
														className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-destructive"
														onClick={handleClearCnpj}
													>
														<X className="h-4 w-4" />
													</Button>
												)}
											</div>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="legalName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Razão Social *</FormLabel>
										<FormControl>
											<Input placeholder="Preenchido automaticamente" {...field} disabled={isCustomerDataLocked || isFetchingCnpj} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
							<FormField
								control={form.control}
								name="incorporationDate"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Data de Fundação *</FormLabel>
										<FormControl>
											<Input
												placeholder="DD/MM/AAAA"
												{...field}
												onChange={(e) => {
													field.onChange(maskDate(e.target.value))
												}}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="annualRevenue"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Faturamento Anual</FormLabel>
										<FormControl>
											<div className="relative">
												<span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground">R$</span>
												<Input
													placeholder="1.000.000,00"
													className="pl-9"
													{...field}
													onChange={(e) => {
														field.onChange(maskNumber(e.target.value, 15))
													}}
													disabled={isCustomerDataLocked || isFetchingCnpj}
												/>
											</div>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
					</>
				) : (
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
						<FormField
							control={form.control}
							name="cpf"
							render={({ field }) => (
								<FormItem>
									<FormLabel>CPF *</FormLabel>
									<FormControl>
										<Input
											placeholder="000.000.000-00"
											{...field}
											onChange={(e) => {
												field.onChange(maskCpf(e.target.value))
											}}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Nome Completo *</FormLabel>
									<FormControl>
										<Input placeholder="Nome do cliente" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
				)}

				<fieldset disabled={isCustomerDataLocked || isFetchingCnpj} className="group/fs space-y-6">
					<div className="group-disabled/fs:opacity-70 space-y-6">
						<h3 className="border-t border-border pt-4 text-lg font-medium">Dados de Contato</h3>
						<FormField
							control={form.control}
							name="contactName"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Nome do Responsável *</FormLabel>
									<FormControl>
										<Input placeholder="João da Silva" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
							<FormField
								control={form.control}
								name="contactPhone"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Celular do Responsável *</FormLabel>
										<FormControl>
											<Input
												placeholder="(11) 99999-9999"
												{...field}
												onChange={(e) => {
													field.onChange(maskPhone(e.target.value))
												}}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="contactEmail"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Email do Responsável *</FormLabel>
										<FormControl>
											<Input placeholder="contato@empresa.com" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
					</div>
				</fieldset>
			</div>

			<div className="flex justify-between pt-8">
				<Button type="button" variant="outline" onClick={onBack}>
					<ArrowLeft className="mr-2 h-4 w-4" /> Voltar
				</Button>
				<Button type="button" onClick={onNext}>
					Próximo <ArrowRight className="ml-2 h-4 w-4" />
				</Button>
			</div>
		</form>
	)
}

export { SimulationStep2 }
