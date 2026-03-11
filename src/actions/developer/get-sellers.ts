'use server'

import { createClient } from '@/lib/supabase/server'
import { ActionResponse } from '@/types/action-response'

export type Seller = {
    id: string
    name: string
    email: string
}

export default async function getSellers(): Promise<ActionResponse<Seller[]>> {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { success: false, message: 'Usuário não autenticado.' }
    }

    try {
        const { data, error } = await supabase
            .from('sellers')
            .select('id, name, email')
            .order('name')

        if (error) {
            console.error('Erro ao buscar vendedores:', error)
            return { success: false, message: error.message }
        }

        return { success: true, message: 'Vendedores carregados com sucesso.', data: data || [] }
    } catch (error) {
        console.error('Erro inesperado em getSellers:', error)
        return { success: false, message: 'Erro inesperado.' }
    }
}