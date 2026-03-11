'use server'

import { createAdminClient } from "@/lib/supabase/admin"
import { ActionResponse } from '@/types/action-response'

interface UpdateApiKeyParams {
    name?: string
    webhook_url?: string | null
    partner_id?: string
    internal_manager_id?: string
    is_active?: boolean
    scopes?: string[]  
}

export default async function updateApiKey(
    id: string,
    updates: UpdateApiKeyParams
): Promise<ActionResponse<null>> {
    const supabase = await createAdminClient()

    try {  
        const scopes = [
            'orders:read', 
            'orders:write', 
            'data:read', 
            'data:write', 
            'simulations:read', 
            'simulations:write'
        ] 
 
        const { error } = await supabase
            .from('api_keys')
            .update({
                ...updates, scopes
            })
            .eq('id', id)

        if (error) {
            console.error('Erro ao atualizar chave de API:', error)
            return { success: false, message: error.message }
        }

        return { success: true, message: 'Chave atualizada com sucesso', data: null }
    } catch (error) {
        console.error('Erro inesperado em updateApiKey:', error)
        return { success: false, message: 'Erro inesperado.' }
    }
}