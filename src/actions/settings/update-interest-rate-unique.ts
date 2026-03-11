"use server"

import { revalidatePath } from "next/cache"

import { createAdminClient } from "@/lib/supabase/admin"
import type { ActionResponse } from "@/types/action-response"

// ✅ TODOS os RateIds possíveis para ORDERS
export type OrderRateId =
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

  // PJ - Service Fee (com meses) - TODOS os meses
  | 'pj_service_fee_24'
  | 'pj_service_fee_30'
  | 'pj_service_fee_36'
  | 'pj_service_fee_48'
  | 'pj_service_fee_60'
  | 'pj_service_fee_72'
  | 'pj_service_fee_84'
  | 'pj_service_fee_96'

  // PJ - Interest Rate (com meses) - TODOS os meses
  | 'pj_interest_rate_24'
  | 'pj_interest_rate_30'
  | 'pj_interest_rate_36'
  | 'pj_interest_rate_48'
  | 'pj_interest_rate_60'
  | 'pj_interest_rate_72'
  | 'pj_interest_rate_84'
  | 'pj_interest_rate_96'

interface UpdateRateParams {
  rateId: OrderRateId
  value: number
  orderId: string
}

async function updateRateUnique({ rateId, value, orderId }: UpdateRateParams): Promise<ActionResponse<null>> {
  try {
    const supabase = createAdminClient()

    // Atualizar APENAS o campo desejado + timestamp
    const { error } = await supabase
      .from("orders")
      .update({
        [rateId]: value,
        updated_at: new Date().toISOString()
      })
      .eq("id", orderId)

    if (error) {
      console.error(`Error updating ${rateId}:`, error)
      return { success: false, message: `Não foi possível atualizar a taxa "${rateId}".` }
    }

    revalidatePath("/dashboard/admin/settings")
    revalidatePath(`/dashboard/orders/${orderId}`)

    return { success: true, message: "Taxa atualizada com sucesso!", data: null }
  } catch (e) {
    console.error(`Unexpected error in updateRateUnique for ${rateId}:`, e)
    return { success: false, message: "Ocorreu um erro inesperado." }
  }
}

export default updateRateUnique
