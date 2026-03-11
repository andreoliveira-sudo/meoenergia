import { createAdminClient } from "@/lib/supabase/admin"
import type { ActionResponse } from '@/types/action-response'

export async function getPfRates(): Promise<ActionResponse<any>> {
  try {
    const supabase = createAdminClient()

    const { data: rates, error } = await supabase
      .from('rates')
      .select('id, value')
      .in('id', [
        'pf_interest_rate_24',
        'pf_interest_rate_30',
        'pf_interest_rate_36',
        'pf_interest_rate_48',
        'pf_interest_rate_60',
        'pf_interest_rate_72',
        'pf_interest_rate_84',
        'pf_interest_rate_96',
        'pf_management_fee',
        'pf_service_fee',
        'pf_service_fee_24',
        'pf_service_fee_30',
        'pf_service_fee_36',
        'pf_service_fee_48',
        'pf_service_fee_60',
        'pf_service_fee_72',
        'pf_service_fee_84',
        'pf_service_fee_96'
      ])

    if (error) {
      return {
        success: false,
        message: error.message
      }
    }

    if (!rates || rates.length === 0) {
      return {
        success: false,
        message: 'Configurações de taxas não encontradas'
      }
    }

    // Transformar array em objeto para facilitar o uso
    const ratesObject = rates.reduce((acc, rate) => {
      acc[rate.id] = rate.value
      return acc
    }, {} as Record<string, any>)

    return {
      success: true,
      message: 'Taxas obtidas com sucesso',
      data: ratesObject
    }
  } catch (error) {
    console.error('Erro ao buscar taxas:', error)
    return {
      success: false,
      message: 'Erro interno ao buscar taxas'
    }
  }
}

export async function getPjRates(): Promise<ActionResponse<any>> {
  try {
    const supabase = createAdminClient()

    const { data: rates, error } = await supabase
      .from('rates')
      .select('id, value')
      .in('id', [
        'pj_interest_rate_24',
        'pj_interest_rate_36',
        'pj_interest_rate_48',
        'pj_interest_rate_60',
        'pj_management_fee',
        'pj_service_fee',
      ])

    if (error) {
      return {
        success: false,
        message: error.message
      }
    }

    if (!rates || rates.length === 0) {
      return {
        success: false,
        message: 'Configurações de taxas PJ não encontradas'
      }
    }

    const ratesObject = rates.reduce((acc, rate) => {
      acc[rate.id] = rate.value
      return acc
    }, {} as Record<string, any>)

    return {
      success: true,
      message: 'Taxas PJ obtidas com sucesso',
      data: ratesObject
    }
  } catch (error) {
    console.error('Erro ao buscar taxas PJ:', error)
    return {
      success: false,
      message: 'Erro interno ao buscar taxas PJ'
    }
  }
}

export async function getRatesByCustomerType(type: 'pf' | 'pj') {
  const response = type === 'pj' ? await getPjRates() : await getPfRates()
  if (!response.success || !response.data) return null

  const rates = response.data
  return {
    managementFeePercent: type === 'pj'
      ? (rates.pj_management_fee ?? 4)
      : (rates.pf_management_fee ?? 8),
    serviceFeePercent: type === 'pj'
      ? (rates.pj_service_fee ?? 8)
      : (rates.pf_service_fee ?? 8),
  }
}
