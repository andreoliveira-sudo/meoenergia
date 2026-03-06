'use server'

import { createClient } from '@/lib/supabase/server'
import { ActionResponse } from '@/types/action-response'
import { revalidatePath } from 'next/cache'

interface UpdateTemplateParams {
    id: string
    whatsapp_text: string
    active: boolean
}

export default async function updateNotificationTemplate({
    id,
    whatsapp_text,
    active,
}: UpdateTemplateParams): Promise<ActionResponse<null>> {
    const supabase = await createClient()

    // Validação de Admin (Camada extra além do RLS)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { success: false, message: 'Usuário não autenticado' }
    }

    // Opcional: checar role 'admin' explicitamente se nao confiar apenas no RLS para write
    // RLS Policy "Admins can manage templates" deve bloquear se nao for admin

    const { error } = await supabase
        .from('notification_templates')
        .update({
            whatsapp_text,
            active,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)

    if (error) {
        console.error('Erro ao atualizar template:', error)
        return { success: false, message: 'Erro ao atualizar template' }
    }

    revalidatePath('/dashboard/settings') // Caminho hipotético, revalidar onde for usado
    return { success: true, message: 'Template atualizado com sucesso', data: null }
}
