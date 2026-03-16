'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { ActionResponse } from '@/types/action-response'
import { fireWebhookByKdi } from '@/lib/webhook-sender'

/**
 * Reenvia o webhook do status ATUAL de um pedido específico.
 * Busca o pedido pelo ID, obtém o KDI e status atual, e dispara o webhook.
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
 * Replay em massa: encontra todos os pedidos com api_key_id que foram aprovados/reprovados
 * no período informado e reenvia o webhook do status atual de cada um.
 */
export async function replayMissedWebhooks(dateFrom: string, dateTo: string, delayMs: number = 2000): Promise<ActionResponse<{ total: number; sent: number; errors: number }>> {
    const userClient = await createClient()
    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) {
        return { success: false, message: 'Usuario nao autenticado.' }
    }

    try {
        const supabase = createAdminClient() as any

        // Buscar TODOS os pedidos com api_key_id no período (qualquer status)
        // Inclui aprovados, reprovados, e qualquer outro status que tenha webhook configurado
        const { data: orders, error } = await supabase
            .from('orders')
            .select('id, kdi, status, api_key_id, updated_at')
            .not('api_key_id', 'is', null)
            .gte('updated_at', `${dateFrom}T00:00:00`)
            .lte('updated_at', `${dateTo}T23:59:59`)
            .order('updated_at', { ascending: true })

        if (error) {
            console.error('Erro ao buscar pedidos para replay:', error)
            return { success: false, message: `Erro ao buscar pedidos: ${error.message}` }
        }

        if (!orders || orders.length === 0) {
            return { success: true, message: 'Nenhum pedido encontrado no periodo com api_key_id.', data: { total: 0, sent: 0, errors: 0 } }
        }

        let sent = 0
        let errors = 0

        for (const order of orders) {
            try {
                await fireWebhookByKdi(String(order.kdi), order.status)
                sent++
                // Delay configurável para não sobrecarregar o servidor/parceiro
                if (delayMs > 0) {
                    await new Promise(resolve => setTimeout(resolve, delayMs))
                }
            } catch {
                errors++
                console.error(`[replay] Erro no KDI ${order.kdi}`)
            }
        }

        return {
            success: true,
            message: `Replay concluido: ${sent} enviados, ${errors} erros de ${orders.length} pedidos.`,
            data: { total: orders.length, sent, errors }
        }
    } catch (error) {
        console.error('Erro no replay de webhooks:', error)
        return { success: false, message: 'Erro inesperado no replay.' }
    }
}
