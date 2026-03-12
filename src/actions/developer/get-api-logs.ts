'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { ActionResponse } from '@/types/action-response'

export interface ApiLog {
    id: string
    method: string
    path: string
    status_code: number
    duration_ms: number | null
    created_at: string
    api_key_name: string | null
    api_key_prefix: string | null
}

export default async function getApiLogs(): Promise<ActionResponse<ApiLog[]>> {
    // Verificar autenticação com client do usuário
    const userClient = await createClient()
    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) {
        return { success: false, message: 'Usuário não autenticado.' }
    }

    try {
        // Usar admin client para bypass RLS (api_logs não tem policy de leitura)
        const supabase = createAdminClient() as any

        // Buscar logs sem join (evita falha se FK não existe no PostgREST)
        const { data: logs, error } = await supabase
            .from('api_logs')
            .select('id, api_key_id, method, path, status_code, duration_ms, created_at')
            .order('created_at', { ascending: false })
            .limit(500)

        if (error) {
            console.error('Erro ao buscar logs de API:', error)
            return { success: false, message: 'Erro ao carregar logs de API.' }
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

        const mapped: ApiLog[] = logs.map((log: any) => {
            const key = keysMap[log.api_key_id] || null
            return {
                id: log.id,
                method: log.method || 'GET',
                path: log.path || '',
                status_code: log.status_code || 0,
                duration_ms: log.duration_ms ?? null,
                created_at: log.created_at,
                api_key_name: key?.name || null,
                api_key_prefix: key?.key_prefix || null,
            }
        })

        return { success: true, message: 'Logs carregados com sucesso', data: mapped }
    } catch (error) {
        console.error('Erro inesperado em getApiLogs:', error)
        return { success: false, message: 'Erro inesperado.' }
    }
}
