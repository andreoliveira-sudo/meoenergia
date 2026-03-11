"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Save } from "lucide-react"
import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"

import { getRateUniqueFromSimulationId } from "@/actions/settings"
import updateSimulationRate from "@/actions/simulations/update-simulation-rate"
import type { SimulationRateId } from "@/actions/settings/get-rate-unique-from-simulation-id"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { maskNumber } from "@/lib/masks"

// ✅ Importar o tipo da action
type RateProps = {
  rateId: SimulationRateId
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
    queryKey: ["rate", rateId, "simulation", simulationId],
    queryFn: async () => {
      return getRateUniqueFromSimulationId(rateId, simulationId)
    },
    enabled: true
  })

  useEffect(() => {
    if (rateData?.success) {
      const safeValue = rateData.data ?? 0
      const displayValue = safeValue.toString().replace(".", ",")
      setValue(displayValue)
    }
  }, [rateData])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const maskedValue = maskNumber(e.target.value, 4)
    setValue(maskedValue)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

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
            queryClient.invalidateQueries({ queryKey: ["rate", rateId, "simulation", simulationId] })
            queryClient.invalidateQueries({ queryKey: ["simulation-details", simulationId] })
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

  // Título baseado no rateId
  const getTitle = () => {
    const months = rateId.split('_')[2]
    const type = rateId.includes('interest') ? 'Juros' : 'Serviços'
    return `${type} - ${months} Meses`
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm">
      <div className="space-y-2">
        <Label htmlFor={rateId}>{getTitle()} (%)</Label>
        <div className="relative">
          <Input 
            id={rateId} 
            type="text" 
            inputMode="decimal" 
            placeholder="0,00" 
            value={value} 
            onChange={handleChange} 
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Use vírgula como separador decimal. Ex: 2,10 para 2,10%.
        </p>
      </div>
      <Button type="submit" className="self-start" disabled={isPending}>
        {isPending ? <Loader2 className="animate-spin" /> : <Save />}
        Salvar Alterações
      </Button>
    </form>
  )
}