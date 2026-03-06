'use server'

import { createClient } from '@/lib/supabase/server'
import { ActionResponse } from '@/types/action-response'

export interface ApiKey {
    id: string
    name: string
    key_prefix: string
    scopes: string[]
    last_used_at: string | null
    created_at: string
    is_active: boolean
    user_email?: string
}

export default async function getApiKeys(): Promise<ActionResponse<ApiKey[]>> {
    const supabase = await createClient()

    try {
        const { data, error } = await supabase
            .from('api_keys')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Erro ao buscar chaves de API:', error)
            return { success: false, message: 'Erro ao carregar chaves de API.' }
        }

        const keys: ApiKey[] = data.map((key: any) => ({
            id: key.id,
            name: key.name,
            key_prefix: key.key_prefix,
            scopes: key.scopes || [],
            last_used_at: key.last_used_at,
            created_at: key.created_at,
            is_active: key.is_active,
            // Cannot join with users table directly due to missing FK in schema cache
            user_email: 'N/A'
        }))

        return { success: true, message: 'Chaves carregadas com sucesso', data: keys }
    } catch (error) {
        console.error('Erro inesperado em getApiKeys:', error)
        return { success: false, message: 'Erro inesperado.' }
    }
}
