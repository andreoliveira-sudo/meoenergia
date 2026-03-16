'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { ActionResponse } from '@/types/action-response'

export interface WebhookLog {
    id: string
    event_type: string
    url: string
    status_code: number
    success: boolean
    error_message: string | null
    payload: Record<string, unknown> | null
    response_body: string | null
    created_at: string
    api_key_name: string | null
    api_key_prefix: string | null
}

export default async function getWebhookLogs(): Promise<ActionResponse<WebhookLog[]>> {
    // Verificar autenticacao com client do usuario
    const userClient = await createClient()
    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) {
        return { success: false, message: 'Usuario nao autenticado.' }
    }

    try {
        // Usar admin client para bypass RLS
        const supabase = createAdminClient() as any

        // Buscar logs de webhook
        const { data: logs, error } = await supabase
            .from('api_key_webhook_logs')
            .select('id, api_key_id, event_type, url, status_code, success, error_message, payload, response_body, created_at')
            .order('created_at', { ascending: false })
            .limit(500)

        if (error) {
            console.error('Erro ao buscar logs de webhook:', error)
            return { success: false, message: 'Erro ao carregar logs de webhook. A tabela pode nao existir ainda.' }
        }

        if (!logs || logs.length === 0) {
            return { success: true, message: 'Nenhum log encontrado.', data: [] }
        }

        // Buscar api_keys separadamente para lookup
        const keyIds = [...new Set(logs.map((l: any) => l.api_key_id).filter(Boolean))]
        let keysMap: Record<string, { name: string; key_prefix: string }> = {}

        if (keyIds.length > 0) {
            const { data: keys } = await supabase
                .from('api_keys')
                .select('id, name, key_prefix')
                .in('id', keyIds)

            if (keys) {
                keysMap = Object.fromEntries(
                    keys.map((k: any) => [k.id, { name: k.name, key_prefix: k.key_prefix }])
                )
            }
        }

        const mapped: WebhookLog[] = logs.map((log: any) => {
            const key = keysMap[log.api_key_id] || null
            return {
                id: log.id,
                event_type: log.event_type || '',
                url: log.url || '',
                status_code: log.status_code || 0,
                success: !!log.success,
                error_message: log.error_message || null,
                payload: log.payload || null,
                response_body: log.response_body || null,
                created_at: log.created_at,
                api_key_name: key?.name || null,
                api_key_prefix: key?.key_prefix || null,
            }
        })

        return { success: true, message: 'Logs carregados com sucesso', data: mapped }
    } catch (error) {
        console.error('Erro inesperado em getWebhookLogs:', error)
        return { success: false, message: 'Erro inesperado.' }
    }
}
