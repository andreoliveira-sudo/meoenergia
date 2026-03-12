'use server'

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
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { success: false, message: 'Usuário não autenticado.' }
    }

    try {
        const { data: logs, error } = await (supabase as any)
            .from('api_logs')
            .select(`
                id,
                method,
                path,
                status_code,
                duration_ms,
                created_at,
                api_keys ( name, key_prefix )
            `)
            .order('created_at', { ascending: false })
            .limit(500)

        if (error) {
            console.error('Erro ao buscar logs de API:', error)
            return { success: false, message: 'Erro ao carregar logs de API.' }
        }

        if (!logs || logs.length === 0) {
            return { success: true, message: 'Nenhum log encontrado.', data: [] }
        }

        const mapped: ApiLog[] = logs.map((log: any) => ({
            id: log.id,
            method: log.method || 'GET',
            path: log.path || '',
            status_code: log.status_code || 0,
            duration_ms: log.duration_ms ?? null,
            created_at: log.created_at,
            api_key_name: log.api_keys?.name || null,
            api_key_prefix: log.api_keys?.key_prefix || null,
        }))

        return { success: true, message: 'Logs carregados com sucesso', data: mapped }
    } catch (error) {
        console.error('Erro inesperado em getApiLogs:', error)
        return { success: false, message: 'Erro inesperado.' }
    }
}
