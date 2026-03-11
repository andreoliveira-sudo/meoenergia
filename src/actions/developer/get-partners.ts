'use server'

import { createClient } from '@/lib/supabase/server'
import { ActionResponse } from '@/types/action-response'

export type Partner = {
    id: string
    legal_business_name: string
    contact_name: string
}

export default async function getPartners(): Promise<ActionResponse<Partner[]>> {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { success: false, message: 'Usuário não autenticado.' }
    }

    try {
        const { data, error } = await supabase
            .from('partners')
            .select('id, legal_business_name, contact_name')
            .order('legal_business_name')

        if (error) {
            console.error('Erro ao buscar parceiros:', error)
            return { success: false, message: error.message }
        }

        return { success: true, message: 'Parceiros carregados com sucesso.', data: data || [] }
    } catch (error) {
        console.error('Erro inesperado em getPartners:', error)
        return { success: false, message: 'Erro inesperado.' }
    }
}