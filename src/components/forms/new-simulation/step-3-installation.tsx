// step-3-installation.tsx
"use client"

import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react"
import { useState } from "react"
import { useFormContext } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSimulation } from "@/contexts/simulation-context"
import { brazilianStates } from "@/lib/constants"
import { maskCep } from "@/lib/masks"

interface Step3Props {
	onNext: () => void
	onBack: () => void
}

const SimulationStep3 = ({ onNext, onBack }: Step3Props) => {
	const form = useFormContext()
	const { setValue, setFocus, trigger } = form
	const [isFetchingCep, setIsFetchingCep] = useState<boolean>(false)
	const { isCustomerDataLocked } = useSimulation()

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
				toast.error("CEP não encontrado", { description: "Por favor, verifique o CEP digitado." })
				setValue("street", "")
				setValue("neighborhood", "")
				setValue("city", "")
				setValue("state", "")
				return
			}
			setValue("street", data.logradouro, { shouldValidate: true })
			setValue("neighborhood", data.bairro, { shouldValidate: true })
			setValue("city", data.localidade, { shouldValidate: true })
			setValue("state", data.uf, { shouldValidate: true })
			trigger(["street", "neighborhood", "city", "state"])
			setFocus("number")
		} catch (error) {
			console.error("Falha ao buscar CEP:", error)
			toast.error("Erro ao buscar CEP", { description: "Não foi possível buscar os dados do endereço. Tente novamente." })
		} finally {
			setIsFetchingCep(false)
		}
	}

	return (
		<form className="space-y-6">
			<h3 className="text-lg font-medium">Passo 3: Local de Instalação</h3>
			<fieldset disabled={isCustomerDataLocked} className="group/fs">
				<div className="space-y-6 group-disabled/fs:opacity-70">
					<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
						<FormField
							control={form.control}
							name="cep"
							render={({ field }) => (
								<FormItem className="md:col-span-1">
									<FormLabel>CEP *</FormLabel>
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
							control={form.control}
							name="street"
							render={({ field }) => (
								<FormItem className="md:col-span-2">
									<FormLabel>Rua *</FormLabel>
									<FormControl>
										<Input placeholder="Avenida Paulista" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
					<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
						<FormField
							control={form.control}
							name="number"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Número *</FormLabel>
									<FormControl>
										<Input placeholder="123" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="complement"
							render={({ field }) => (
								<FormItem className="md:col-span-2">
									<FormLabel>Complemento (Opcional)</FormLabel>
									<FormControl>
										<Input placeholder="Apto 101, Bloco B" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
					<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
						<FormField
							control={form.control}
							name="neighborhood"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Bairro *</FormLabel>
									<FormControl>
										<Input placeholder="Bela Vista" {...field} />
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
									<FormLabel>Cidade *</FormLabel>
									<FormControl>
										<Input placeholder="São Paulo" {...field} />
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
									<FormLabel>Estado *</FormLabel>
									<Select onValueChange={field.onChange} value={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Selecione o estado" />
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
			</fieldset>
			<div className="flex justify-between pt-8">
				<Button type="button" variant="outline" onClick={onBack}>
					<ArrowLeft className="mr-2 h-4 w-4" /> Voltar
				</Button>
				<Button type="button" onClick={onNext}>
					Próximo <ArrowRight className="mr-2 h-4 w-4" />
				</Button>
			</div>
		</form>
	)
}

export { SimulationStep3 }
