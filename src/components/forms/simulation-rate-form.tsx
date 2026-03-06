"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Save } from "lucide-react"
import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"

import { getRateUniqueFromSimulationId } from "@/actions/settings"
import updateSimulationRate from "@/actions/simulations/update-simulation-rate"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { maskNumber } from "@/lib/masks"

type RateProps = {
	rateId: "service_fee_36" | "service_fee_48" | "service_fee_60" | "interest_rate_36" | "interest_rate_48" | "interest_rate_60"
	simulationId: string
}

export const SimulationRateForm = ({ rateId, simulationId }: RateProps) => {
	const [value, setValue] = useState("")
	const [isPending, startTransition] = useTransition()
	const queryClient = useQueryClient()

	const {
		data: rateData,
		isLoading,
		isError
	} = useQuery({
		queryKey: ["rate", rateId, "global"],
		queryFn: async () => {
			return getRateUniqueFromSimulationId(rateId, simulationId)
		},
		enabled: true
	})

	useEffect(() => {
		if (rateData?.success) {
			// O valor do banco já vem no formato correto (35.00, 2.10)
			// Convertemos para string com vírgula para exibição brasileira
			const displayValue = rateData.data.toString().replace(".", ",")
			setValue(displayValue)
		}
	}, [rateData])

	function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
		// Aplica máscara apenas no que o usuário digita
		const maskedValue = maskNumber(e.target.value, 4)
		setValue(maskedValue)
	}

	function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault()

		// Converte de volta para formato numérico (35,00 -> 35.00)
		const numericValue = parseFloat(value.replace(/\./g, "").replace(",", "."))
		if (Number.isNaN(numericValue) || numericValue < 0) {
			toast.error("Valor inválido", {
				description: "A taxa não pode ser menor que zero."
			})
			return
		}

		startTransition(() => {
			toast.promise(updateSimulationRate({ rateId, value: numericValue, simulationId }), {
				loading: "Salvando alterações...",
				success: (res) => {
					if (res.success) {
						queryClient.invalidateQueries({ queryKey: ["rate", rateId, "simulations"] })
						// Invalida também as queries do step-4 para atualizar os cálculos
						queryClient.invalidateQueries({ queryKey: ["rates", "interest_rate", "service_fee", "simulations"] })
						queryClient.invalidateQueries({ queryKey: ["simulations-details", simulationId] })
						queryClient.invalidateQueries({ queryKey: ["simulations"] })
						return "Taxa salva com sucesso!"
					}
					throw new Error(res.message)
				},
				error: (err) => err.message
			})
		})
	}

	if (isLoading) {
		return <Skeleton className="h-24 w-full max-w-sm" />
	}

	if (isError) {
		return <p className="text-destructive">Não foi possível carregar a taxa.</p>
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm">
			<div className="space-y-2">
				<Label htmlFor={rateId}>Taxa (%)</Label>
				<div className="relative">
					<Input id={rateId} type="text" inputMode="decimal" placeholder="0,00" value={value} onChange={handleChange} />
					<span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
				</div>
				<p className="text-xs text-muted-foreground">Use vírgula como separador decimal. Ex: 2,10 para 2,10%.</p>
			</div>
			<Button type="submit" className="self-start" disabled={isPending}>
				{isPending ? <Loader2 className="animate-spin" /> : <Save />}
				Salvar Alterações
			</Button>
		</form>
	)
}
