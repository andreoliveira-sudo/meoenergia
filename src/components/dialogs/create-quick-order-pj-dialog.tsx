"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import createQuickOrderPJ from "@/actions/orders/create-quick-order-pj"
import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatNumberFromDatabase, maskCep, maskCnpj, maskPhone } from "@/lib/masks"
import { quickOrderPJSchema, type QuickOrderPJSchema } from "@/lib/validations/fast-track-order"

const FINANCING_TERMS_PJ = [36, 48, 60]
const PAYMENT_DAYS = [5, 15, 20, 30]

export function CreateQuickOrderPJDialog() {
	const [open, setOpen] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [isFetchingCep, setIsFetchingCep] = useState(false)
	const router = useRouter()
	const queryClient = useQueryClient()

	const form = useForm<QuickOrderPJSchema>({
		resolver: zodResolver(quickOrderPJSchema) as any,
		defaultValues: {
			cnpj: "",
			company_name: "",
			trading_name: "",
			contact_name: "",
			email: "",
			phone: "",
			postal_code: "",
			street: "",
			neighborhood: "",
			city: "",
			state: "",
			number: "",
			current_consumption: "" as any,
			monthly_bill_value: "" as any,
			system_power: "" as any,
			equipment_value: "" as any,
			labor_value: "" as any,
			payment_day: "" as any,
			financing_term: "" as any,
		},
	})

	const { setValue, setFocus, reset } = form

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
			setValue("street", data.logradouro)
			setValue("neighborhood", data.bairro)
			setValue("city", data.localidade)
			setValue("state", data.uf)
			setFocus("number")
		} catch (error) {
			console.error("Falha ao buscar CEP:", error)
			toast.error("Erro ao buscar CEP")
		} finally {
			setIsFetchingCep(false)
		}
	}

	async function handleCnpjBlur(e: React.FocusEvent<HTMLInputElement>) {
		const cnpj = e.target.value.replace(/\D/g, "")
		if (cnpj.length !== 14) return

		setIsLoading(true)
		try {
			const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`)
			if (!response.ok) {
				toast.error("CNPJ não encontrado")
				return
			}
			const data = await response.json()

			setValue("company_name", data.razao_social || "")
			setValue("trading_name", data.nome_fantasia || "")

			if (data.cep) {
				const cleanCep = data.cep.replace(/\D/g, "")
				setValue("postal_code", maskCep(cleanCep))
				setValue("street", data.logradouro || "")
				setValue("neighborhood", data.bairro || "")
				setValue("city", data.municipio || "")
				setValue("state", data.uf || "")
				setValue("number", data.numero || "")
			}

			toast.success("Dados preenchidos automaticamente!")
		} catch (error) {
			console.error("Falha ao buscar CNPJ:", error)
			toast.error("Erro ao buscar dados do CNPJ")
		} finally {
			setIsLoading(false)
		}
	}

	async function onSubmit(data: QuickOrderPJSchema) {
		setIsLoading(true)
		try {
			const result = await createQuickOrderPJ(data)

			if (result.success) {
				toast.success(result.message)
				setOpen(false)
				reset()
				queryClient.invalidateQueries({ queryKey: ["orders-paginated"] })
			} else {
				toast.error(result.message, {
					description: Object.values(result.errors || {}).flat().join(", ")
				})
			}
		} catch (error) {
			toast.error("Erro inesperado ao criar pedido")
			console.error(error)
		} finally {
			setIsLoading(false)
		}
	}

	const MoneyInput = ({ field, ...props }: any) => (
		<Input
			{...props}
			value={field.value !== undefined && field.value !== ""
				? formatNumberFromDatabase(Number(field.value))
				: ""}
			onChange={(e) => {
				const digits = e.target.value.replace(/\D/g, "")
				const realValue = parseFloat(digits) / 100
				field.onChange(realValue)
			}}
		/>
	)

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button>
					<Plus className="mr-2 h-4 w-4" />
					Novo Pedido P.J.
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Novo Pedido Rápido (Pessoa Jurídica)</DialogTitle>
					<DialogDescription>
						Preencha os dados abaixo para criar um pedido rápido PJ.
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

						<div className="space-y-4">
							<h3 className="text-lg font-medium">Dados da Empresa e Contato</h3>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<FormField
									control={form.control}
									name="cnpj"
									render={({ field }) => (
										<FormItem>
											<FormLabel>CNPJ</FormLabel>
											<FormControl>
												<Input
													placeholder="00.000.000/0000-00"
													{...field}
													onChange={(e) => field.onChange(maskCnpj(e.target.value))}
													onBlur={handleCnpjBlur}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<div className="md:col-span-2">
									<FormField
										control={form.control}
										name="company_name"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Razão Social</FormLabel>
												<FormControl>
													<Input placeholder="Razão Social" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="trading_name"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Nome Fantasia (Opcional)</FormLabel>
											<FormControl>
												<Input placeholder="Nome Fantasia" {...field} value={field.value ?? ""} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="contact_name"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Nome do Responsável</FormLabel>
											<FormControl>
												<Input placeholder="Nome Completo" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="phone"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Celular</FormLabel>
											<FormControl>
												<Input
													placeholder="(00) 00000-0000"
													{...field}
													onChange={(e) => field.onChange(maskPhone(e.target.value))}
													maxLength={15}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="email"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Email</FormLabel>
											<FormControl>
												<Input type="email" placeholder="empresa@email.com" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
								<FormField
									control={form.control}
									name="postal_code"
									render={({ field }) => (
										<FormItem>
											<FormLabel>CEP</FormLabel>
											<FormControl>
												<div className="relative">
													<Input
														placeholder="00000-000"
														{...field}
														onChange={(e) => field.onChange(maskCep(e.target.value))}
														onBlur={handleCepBlur}
													/>
													{isFetchingCep && (
														<Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
													)}
												</div>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<div className="md:col-span-2">
									<FormField
										control={form.control}
										name="street"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Rua</FormLabel>
												<FormControl>
													<Input {...field} readOnly={isFetchingCep} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
								<FormField
									control={form.control}
									name="number"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Número</FormLabel>
											<FormControl>
												<Input {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<FormField
									control={form.control}
									name="neighborhood"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Bairro</FormLabel>
											<FormControl>
												<Input {...field} readOnly={isFetchingCep} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="city"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Cidade</FormLabel>
											<FormControl>
												<Input {...field} readOnly={isFetchingCep} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="state"
									render={({ field }) => (
										<FormItem>
											<FormLabel>UF</FormLabel>
											<FormControl>
												<Input {...field} readOnly={isFetchingCep} maxLength={2} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</div>

						<div className="space-y-4 pt-4 border-t">
							<h3 className="text-lg font-medium">Dados do Pedido</h3>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<FormField
									control={form.control}
									name="current_consumption"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Consumo Médio (kWh)</FormLabel>
											<FormControl>
												<Input type="number" {...field} onChange={e => field.onChange(e.target.value)} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="monthly_bill_value"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Valor da Conta (R$)</FormLabel>
											<FormControl>
												<MoneyInput field={field} placeholder="0,00" />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="system_power"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Potência do Sistema (kWp)</FormLabel>
											<FormControl>
												<Input type="number" step="0.01" {...field} onChange={e => field.onChange(e.target.value)} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="equipment_value"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Valor do Kit (R$)</FormLabel>
											<FormControl>
												<MoneyInput field={field} placeholder="0,00" />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="labor_value"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Valor Mão de Obra (R$)</FormLabel>
											<FormControl>
												<MoneyInput field={field} placeholder="0,00" />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="financing_term"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Prazo Financiamento (Meses)</FormLabel>
											<FormControl>
												<Select
													onValueChange={(v) => field.onChange(parseInt(v))}
													value={field.value != null ? String(field.value) : ""}
												>
													<SelectTrigger>
														<SelectValue placeholder="Selecione" />
													</SelectTrigger>
													<SelectContent>
														{FINANCING_TERMS_PJ.map(term => (
															<SelectItem key={term} value={String(term)}>
																{term} meses
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="payment_day"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Dia do Pagamento</FormLabel>
											<FormControl>
												<Select
													onValueChange={(v) => field.onChange(parseInt(v))}
													value={field.value != null ? String(field.value) : ""}
												>
													<SelectTrigger>
														<SelectValue placeholder="Selecione" />
													</SelectTrigger>
													<SelectContent>
														{PAYMENT_DAYS.map(day => (
															<SelectItem key={day} value={String(day)}>
																Dia {String(day).padStart(2, "0")}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</div>

						<DialogFooter>
							<Button type="button" variant="outline" onClick={() => setOpen(false)}>
								Cancelar
							</Button>
							<Button type="submit" disabled={isLoading}>
								{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								Criar Pedido PJ
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
