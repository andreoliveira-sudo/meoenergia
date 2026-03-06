'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse } from '@/types/action-response'

interface OrderHistoryEntry {
    id: string
    old_status: string | null
    new_status: string
    changed_by: string | null
    changed_at: string
    reason: string | null
    user?: { name: string }
}

export default async function getOrderHistoryAction(
    orderId: string
): Promise<ActionResponse<OrderHistoryEntry[]>> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('order_history')
        .select(`
      id,
      old_status,
      new_status,
      changed_by,
      changed_at,
      reason,
      user:changed_by(name)
    `)
        .eq('order_id', orderId)
        .order('changed_at', { ascending: false })

    if (error) {
        console.error('Erro ao buscar histórico:', error)
        return { success: false, message: 'Erro ao carregar histórico' }
    }

    // Transform log entries safely
    const formattedData = data?.map(entry => ({
        ...entry,
        user: entry.user ? entry.user : { name: 'Sistema' } // Fallback for null user
    })) as OrderHistoryEntry[]

    return {
        success: true,
        message: 'Histórico carregado',
        data: formattedData,
    }
}
