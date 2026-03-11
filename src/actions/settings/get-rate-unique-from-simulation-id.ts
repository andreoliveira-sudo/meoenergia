"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import type { ActionResponse } from "@/types/action-response"

// ✅ Tipos para simulações (SEM pf/pj - são taxas padrão)
export type SimulationRateId = 
  | 'service_fee_36'
  | 'service_fee_48' 
  | 'service_fee_60'
  | 'interest_rate_36'
  | 'interest_rate_48'
  | 'interest_rate_60'

async function getRateUniqueFromSimulationId(
  rateId: SimulationRateId,
  simulationId: string
): Promise<ActionResponse<number>> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("simulations")
      .select(`${rateId}`)
      .eq("id", simulationId)
      .single()

    if (error || !data) {
      console.error(`Error fetching ${rateId}:`, error)
      return { success: false, message: `Taxa "${rateId}" não encontrada.` }
    }

    const rateValue = data[rateId as keyof typeof data] as number
    return { success: true, message: "Taxa carregada.", data: rateValue }
  } catch (e) {
    console.error(`Unexpected error in getRateUniqueFromSimulationId for ${rateId}:`, e)
    return { success: false, message: "Ocorreu um erro inesperado." }
  }
}

export default getRateUniqueFromSimulationId