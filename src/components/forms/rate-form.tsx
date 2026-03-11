"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Save } from "lucide-react"
import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"

import { getRate, getRateUnique, updateRate, updateRateUnique } from "@/actions/settings"
import type { GlobalRateId } from "@/actions/settings/get-interest-rate"
import type { RateId } from "@/actions/settings/get-rate-from-order-id"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { maskNumber } from "@/lib/masks"

// Meses disponíveis
type MonthType = 24 | 30 | 36 | 48 | 60 | 72 | 84 | 96

// Customer type
type CustomerType = 'pj' | 'pf'

// ✅ Taxas de gestão (sem meses) - APENAS para PF
type ManagementFeeId = `pf_management_fee`
type ManagementPjFeeId = `pj_management_fee`

// ✅ Taxas de serviço (sem meses) - para PF e PJ
type ServiceFeeId = `${CustomerType}_service_fee`
type ServiceFeePjId = `${CustomerType}_service_fee`

// ✅ Taxas mensais (com meses) - para PF e PJ
type MonthlyRateId = `${CustomerType}_${'service_fee' | 'interest_rate'}_${MonthType}`

// ✅ União de TODOS os tipos para ORDERS
export type OrderRateId = ManagementFeeId | ServiceFeePjId | ServiceFeeId | MonthlyRateId | ManagementPjFeeId

// 📋 LISTA COMPLETA DE TODAS AS RATEIDS PARA O COMPONENTE
export const ALL_RATE_IDS = {
  // Taxas Globais (rates table)
  GLOBAL: [
    'service_fee',
    'interest_rate',
    'pf_management_fee',
    'pj_management_fee',
    'pf_service_fee',
    'pj_service_fee',
    'pf_service_fee_24',
    'pf_service_fee_30',
    'pf_service_fee_36',
    'pf_service_fee_48',
    'pf_service_fee_60',
    'pf_service_fee_72',
    'pf_service_fee_84',
    'pf_service_fee_96',
    'pf_interest_rate_24',
    'pf_interest_rate_30',
    'pf_interest_rate_36',
    'pf_interest_rate_48',
    'pf_interest_rate_60',
    'pf_interest_rate_72',
    'pf_interest_rate_84',
    'pf_interest_rate_96',
    'pj_service_fee_24',
    'pj_service_fee_30',
    'pj_service_fee_36',
    'pj_service_fee_48',
    'pj_service_fee_60',
    'pj_service_fee_72',
    'pj_service_fee_84',
    'pj_service_fee_96',
    'pj_interest_rate_24',
    'pj_interest_rate_30',
    'pj_interest_rate_36',
    'pj_interest_rate_48',
    'pj_interest_rate_60',
    'pj_interest_rate_72',
    'pj_interest_rate_84',
    'pj_interest_rate_96',
  ] as const,
  
  // Taxas por Pedido (orders table)
  ORDER: [
    'pf_management_fee',
    'pj_management_fee',
    'pf_service_fee',
    'pj_service_fee',
    'pf_service_fee_24',
    'pf_service_fee_30',
    'pf_service_fee_36',
    'pf_service_fee_48',
    'pf_service_fee_60',
    'pf_service_fee_72',
    'pf_service_fee_84',
    'pf_service_fee_96',
    'pf_interest_rate_24',
    'pf_interest_rate_30',
    'pf_interest_rate_36',
    'pf_interest_rate_48',
    'pf_interest_rate_60',
    'pf_interest_rate_72',
    'pf_interest_rate_84',
    'pf_interest_rate_96',
    'pj_service_fee_24',
    'pj_service_fee_30',
    'pj_service_fee_36',
    'pj_service_fee_48',
    'pj_service_fee_60',
    'pj_service_fee_72',
    'pj_service_fee_84',
    'pj_service_fee_96',
    'pj_interest_rate_24',
    'pj_interest_rate_30',
    'pj_interest_rate_36',
    'pj_interest_rate_48',
    'pj_interest_rate_60',
    'pj_interest_rate_72',
    'pj_interest_rate_84',
    'pj_interest_rate_96',
  ] as const
} as const

type RateFormGlobalProps = {
  rateId: GlobalRateId
  isEditingUniqueOrder?: false | null | undefined
  orderId?: never
  label?: string
}

type RateFormUniqueProps = {
  rateId: OrderRateId
  isEditingUniqueOrder: true
  orderId: string
  label?: string
}

type RateFormProps = RateFormGlobalProps | RateFormUniqueProps

// Títulos automáticos baseados no rateId
const getRateTitle = (rateId: string) => {
  // Taxas Globais Padrão
  if (rateId === 'service_fee') {
    return 'Taxa de Serviços (Padrão)'
  }
  if (rateId === 'interest_rate') {
    return 'Taxa de Juros (Padrão)'
  }
  
  // Taxa de Gestão
  if (rateId === 'pf_management_fee') {
    return 'Taxa de Gestão'
  }
  
  // Taxas de Serviço (sem meses)
  if (rateId === 'pf_service_fee' || rateId === 'pj_service_fee') {
    const customer = rateId === 'pf_service_fee' ? 'PF' : 'PJ'
    return `${customer} - Taxa de Serviços`
  }
  
  // Taxas com meses
  const parts = rateId.split('_')
  const months = parts[parts.length - 1]
  const type = parts.includes('interest') ? 'Juros' : 'Serviços'
  const customer = parts[0] === 'pf' ? 'PF' : 'PJ'
  
  return `${customer} - ${type} - ${months} Meses`
}

export const RateForm = ({ rateId, isEditingUniqueOrder, orderId, label }: RateFormProps) => {
  const [value, setValue] = useState("")
  const [isPending, startTransition] = useTransition()
  const queryClient = useQueryClient()

  const {
    data: rateData,
    isLoading,
    isError
  } = useQuery({
    queryKey: isEditingUniqueOrder ? ["rate", rateId, "unique", orderId] : ["rate", rateId, "global"],
    queryFn: async () => {
      if (isEditingUniqueOrder && orderId) {
        return getRateUnique(rateId as OrderRateId, orderId)
      }
      return getRate(rateId as GlobalRateId)
    },
    enabled: true
  })

  useEffect(() => {
    if (rateData?.success) {
      const displayValue = rateData.data.toString().replace(".", ",")
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

    if (isEditingUniqueOrder) {
      startTransition(() => {
        toast.promise(updateRateUnique({ rateId: rateId as OrderRateId, value: numericValue, orderId }), {
          loading: "Salvando alterações...",
          success: (res) => {
            if (res.success) {
              queryClient.invalidateQueries({ queryKey: ["rate", rateId, "orders"] })
              queryClient.invalidateQueries({ queryKey: ["order-details", orderId] })
              queryClient.invalidateQueries({ queryKey: ["orders"] })
              return "Taxa salva com sucesso!"
            }
            throw new Error(res.message)
          },
          error: (err) => err.message
        })
      })
    } else {
      startTransition(() => {
        toast.promise(updateRate({ rateId: rateId as GlobalRateId, value: numericValue }), {
          loading: "Salvando alterações...",
          success: (res) => {
            if (res.success) {
              queryClient.invalidateQueries({ queryKey: ["rate", rateId] })
              queryClient.invalidateQueries({ queryKey: ["rates"] })
              return "Taxa salva com sucesso!"
            }
            throw new Error(res.message)
          },
          error: (err) => err.message
        })
      })
    }
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
        <Label htmlFor={rateId}>{label || getRateTitle(rateId)} (%)</Label>
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