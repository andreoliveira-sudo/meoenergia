'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { ActionResponse } from '@/types/action-response'
import { fireWebhookByKdi } from '@/lib/webhook-sender'

/**
 * Reenvia o webhook do status ATUAL de um pedido específico.
 */
export async function resendOrderWebhook(orderId: string): Promise<ActionResponse<null>> {
    const userClient = await createClient()
    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) {
        return { success: false, message: 'Usuario nao autenticado.' }
    }

    try {
        const supabase = createAdminClient() as any

        const { data: order, error } = await supabase
            .from('orders')
            .select('id, kdi, status, api_key_id')
            .eq('id', orderId)
            .single()

        if (error || !order) {
            return { success: false, message: 'Pedido nao encontrado.' }
        }

        if (!order.api_key_id) {
            return { success: false, message: 'Pedido nao possui chave API vinculada.' }
        }

        await fireWebhookByKdi(String(order.kdi), order.status)

        return { success: true, message: `Webhook reenviado para KDI ${order.kdi} (status: ${order.status})`, data: null }
    } catch (error) {
        console.error('Erro ao reenviar webhook:', error)
        return { success: false, message: 'Erro ao reenviar webhook.' }
    }
}

/**
 * Lista pedidos que precisam de replay de webhook.
 * Retorna lista de pedidos com api_key_id no período.
 */
export interface ReplayOrder {
    id: string
    kdi: number
    status: string
    updated_at: string
}

export async function getOrdersForReplay(dateFrom: string, dateTo: string): Promise<ActionResponse<ReplayOrder[]>> {
    const userClient = await createClient()
    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) {
        return { success: false, message: 'Usuario nao autenticado.' }
    }

    try {
        const supabase = createAdminClient() as any

        const { data: orders, error } = await supabase
            .from('orders')
            .select('id, kdi, status, updated_at')
            .not('api_key_id', 'is', null)
            .gte('updated_at', `${dateFrom}T00:00:00`)
            .lte('updated_at', `${dateTo}T23:59:59`)
            .order('updated_at', { ascending: true })

        if (error) {
            return { success: false, message: `Erro ao buscar pedidos: ${error.message}` }
        }

        return {
            success: true,
            message: `${orders?.length || 0} pedidos encontrados`,
            data: orders || []
        }
    } catch (error) {
        console.error('Erro ao listar pedidos para replay:', error)
        return { success: false, message: 'Erro inesperado.' }
    }
}

/**
 * Envia webhook para UM pedido (chamado pelo client um por um).
 */
export async function replaySingleWebhook(kdi: string, status: string): Promise<ActionResponse<null>> {
    const userClient = await createClient()
    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) {
        return { success: false, message: 'Usuario nao autenticado.' }
    }

    try {
        await fireWebhookByKdi(kdi, status)
        return { success: true, message: `OK KDI ${kdi}`, data: null }
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Erro desconhecido'
        return { success: false, message: `Erro KDI ${kdi}: ${msg}` }
    }
}
