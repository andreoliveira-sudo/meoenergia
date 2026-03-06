'use server'

import { createClient } from '@/lib/supabase/server'
import { ActionResponse } from '@/types/action-response'

export default async function revokeApiKey(keyId: string): Promise<ActionResponse<void>> {
    const supabase = await createClient()

    try {
        const { error } = await supabase
            .from('api_keys')
            .update({ is_active: false })
            .eq('id', keyId)

        if (error) {
            return { success: false, message: error.message }
        }

        return { success: true, message: 'Chave revogada com sucesso.', data: undefined }
    } catch (error) {
        return { success: false, message: 'Erro inesperado.' }
    }
}
