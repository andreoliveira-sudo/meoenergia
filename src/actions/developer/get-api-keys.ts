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
    webhook_url: string | null 
    partner_id: string | null
    internal_manager_id: string | null
    user_email?: string
    partner_name?: string 
    internal_manager_name?: string 
}

interface RawApiKey {
    id: string
    name: string
    key_prefix: string
    scopes: string[] | null
    last_used_at: string | null
    created_at: string
    is_active: boolean
    webhook_url?: string | null 
    partner_id?: string | null
    internal_manager_id?: string | null
}

export default async function getApiKeys(): Promise<ActionResponse<ApiKey[]>> {
    const supabase = await createClient()

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { success: false, message: 'Usuário não autenticado.' }
    }

    try {
        // 1. Buscar todas as chaves de API
        const { data: keysData, error: keysError } = await supabase
            .from('api_keys')
            .select('*')
            .order('created_at', { ascending: false })

        if (keysError) {
            console.error('Erro ao buscar chaves de API:', keysError)
            return { success: false, message: 'Erro ao carregar chaves de API.' }
        }

        if (!keysData || keysData.length === 0) {
            return { success: true, message: 'Nenhuma chave encontrada.', data: [] }
        }

        // Cast para o tipo correto
        const rawKeys = keysData as RawApiKey[]

        // 2. Coletar IDs únicos de parceiros e gerentes
        const partnerIds = rawKeys
            .map(key => key.partner_id)
            .filter((id): id is string => id !== null && id !== undefined && id !== '')

        const managerIds = rawKeys
            .map(key => key.internal_manager_id)
            .filter((id): id is string => id !== null && id !== undefined && id !== '')

        // 3. Buscar nomes dos parceiros (se houver)
        let partnersMap = new Map<string, string>()
        if (partnerIds.length > 0) {
            const { data: partnersData, error: partnersError } = await supabase
                .from('partners')
                .select('id, legal_business_name, contact_name')
                .in('id', partnerIds)

            if (!partnersError && partnersData) {
                partnersData.forEach(partner => {
                    const displayName = partner.legal_business_name || partner.contact_name || 'N/A'
                    partnersMap.set(partner.id, displayName)
                })
            }
        }

        // 4. Buscar nomes dos gerentes/vendedores (se houver)
        let managersMap = new Map<string, string>()
        if (managerIds.length > 0) {
            const { data: sellersData, error: sellersError } = await supabase
                .from('sellers')
                .select('id, name, email')
                .in('id', managerIds)

            if (!sellersError && sellersData) {
                sellersData.forEach(seller => {
                    managersMap.set(seller.id, seller.name || 'N/A')
                })
            }
        }

        // 5. Mapear os dados com os nomes
        const keys: ApiKey[] = rawKeys.map((key: RawApiKey) => ({
            id: key.id,
            name: key.name,
            key_prefix: key.key_prefix,
            scopes: key.scopes || [],
            last_used_at: key.last_used_at,
            created_at: key.created_at,
            is_active: key.is_active,
            webhook_url: key.webhook_url ?? null,
            partner_id: key.partner_id ?? null,
            internal_manager_id: key.internal_manager_id ?? null,
            user_email: 'N/A',
            partner_name: key.partner_id ? partnersMap.get(key.partner_id) || 'N/A' : 'N/A',
            internal_manager_name: key.internal_manager_id ? managersMap.get(key.internal_manager_id) || 'N/A' : 'N/A'
        }))

        return { success: true, message: 'Chaves carregadas com sucesso', data: keys }
    } catch (error) {
        console.error('Erro inesperado em getApiKeys:', error)
        return { success: false, message: 'Erro inesperado.' }
    }
}