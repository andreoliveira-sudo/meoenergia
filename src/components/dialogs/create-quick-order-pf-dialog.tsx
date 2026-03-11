"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import createQuickOrderPF from "@/actions/orders/create-quick-order"
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
import { formatNumberFromDatabase, maskCep, maskCpf, maskPhone } from "@/lib/masks"
import { quickOrderPFSchema, type QuickOrderPFSchema } from "@/lib/validations/fast-track-order"

const FINANCING_TERMS_PF = [24, 30, 36, 48, 60, 72, 84, 96]
const PAYMENT_DAYS = [5, 15, 20, 30]

export function CreateQuickOrderPFDialog() {
	const [open, setOpen] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [isFetchingCep, setIsFetchingCep] = useState(false)
	const router = useRouter()
	const queryClient = useQueryClient()

	const form = useForm<QuickOrderPFSchema>({
		resolver: zodResolver(quickOrderPFSchema) as any,
		defaultValues: {
			cpf: "",
			name: "",
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

	async function onSubmit(data: QuickOrderPFSchema) {
		setIsLoading(true)
		try {
			const result = await createQuickOrderPF(data)

			if (result.success) {
				toast.success(result.message)
				setOpen(false)
				reset()
				queryClient.invalidateQueries({ queryKey: ["orders-paginated"] })
			} else {
				toast.error(result.message, { description: Object.values(result.errors || {}).flat().join(", ") })
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
			value={field.value !== undefined && field.value !== "" ? formatNumberFromDatabase(Number(field.value)) : ""}
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
					Novo Pedido P.F.
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Novo Pedido Rápido (Pessoa Física)</DialogTitle>
					<DialogDescription>
						Preencha os dados abaixo para criar um pedido simplificado. Os dados técnicos podem ser detalhados posteriormente.
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

						<div className="space-y-4">
							<h3 className="text-lg font-medium">Dados do Cliente</h3>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<FormField
									control={form.control}
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
								<div className="md:col-span-2">
									<FormField
										control={form.control}
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
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="phone"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Celular</FormLabel>
											<FormControl>
												<Input placeholder="(00) 00000-0000" {...field} onChange={(e) => field.onChange(maskPhone(e.target.value))} maxLength={15} />
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
												<Input type="email" placeholder="cliente@email.com" {...field} />
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
													{isFetchingCep && <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
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
														{FINANCING_TERMS_PF.map((term) => (
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
														{PAYMENT_DAYS.map((day) => (
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
							<Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
							<Button type="submit" disabled={isLoading}>
								{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								Criar Pedido
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
