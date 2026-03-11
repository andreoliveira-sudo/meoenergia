"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import type { ActionResponse } from "@/types/action-response"

// ✅ TODAS as taxas globais (vêm da tabela 'rates')
export type GlobalRateId = 
  // Taxas Globais Padrão (sem PF/PJ e sem meses)
  | 'service_fee'
  | 'interest_rate'
  
  // PF - Management Fee
  | 'pf_management_fee'
  | 'pj_management_fee'
  
  // PF - Service Fee (sem meses)
  | 'pf_service_fee'
  
  // PF - Service Fee (com meses)
  | 'pf_service_fee_24'
  | 'pf_service_fee_30'
  | 'pf_service_fee_36'
  | 'pf_service_fee_48'
  | 'pf_service_fee_60'
  | 'pf_service_fee_72'
  | 'pf_service_fee_84'
  | 'pf_service_fee_96'
  
  // PF - Interest Rate (com meses)
  | 'pf_interest_rate_24'
  | 'pf_interest_rate_30'
  | 'pf_interest_rate_36'
  | 'pf_interest_rate_48'
  | 'pf_interest_rate_60'
  | 'pf_interest_rate_72'
  | 'pf_interest_rate_84'
  | 'pf_interest_rate_96'
  
  // PJ - Service Fee (sem meses)
  | 'pj_service_fee'
  
  // PJ - Service Fee (com meses)
  | 'pj_service_fee_24'
  | 'pj_service_fee_30'
  | 'pj_service_fee_36'
  | 'pj_service_fee_48'
  | 'pj_service_fee_60'
  | 'pj_service_fee_72'
  | 'pj_service_fee_84'
  | 'pj_service_fee_96'
  
  // PJ - Interest Rate (com meses)
  | 'pj_interest_rate_24'
  | 'pj_interest_rate_30'
  | 'pj_interest_rate_36'
  | 'pj_interest_rate_48'
  | 'pj_interest_rate_60'
  | 'pj_interest_rate_72'
  | 'pj_interest_rate_84'
  | 'pj_interest_rate_96'

async function getRate(
  rateId: GlobalRateId
): Promise<ActionResponse<number>> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("rates")
      .select("value")
      .eq("id", rateId)
      .single()

    if (error || !data) {
      console.error(`Error fetching ${rateId}:`, error)
      return { success: false, message: `Taxa "${rateId}" não encontrada.` }
    }

    return { success: true, message: "Taxa carregada.", data: data.value }
  } catch (e) {
    console.error(`Unexpected error in getRate for ${rateId}:`, e)
    return { success: false, message: "Ocorreu um erro inesperado." }
  }
}

export default getRate