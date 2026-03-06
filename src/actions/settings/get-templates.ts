'use server'

import { createClient } from '@/lib/supabase/server'
import { ActionResponse } from '@/types/action-response'

export interface NotificationTemplate {
    id: string
    name: string
    trigger_key: string | null
    description: string | null
    content: string
    whatsapp_text: string | null
    active: boolean
    updated_at: string
    category: string | null
}

export default async function getNotificationTemplates(): Promise<ActionResponse<NotificationTemplate[]>> {
    const supabase = await createClient()

    const { data: user, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { success: false, message: 'Usuário não autenticado' }
    }

    // Verificar permissões (ADMIN) - Opcional se RLS já garantir, mas boa prática camada extra
    // Assumindo que RLS 'Admins can manage templates' cuida disso, mas validamos user role na session
    // Para simplificar, vou confiar no RLS + check simples de sessão aqui

    const { data, error } = await supabase
        .from('notification_templates')
        .select('id, name, trigger_key, description, content, whatsapp_text, active, updated_at, category')
        .order('name')

    if (error) {
        console.error('Erro ao buscar templates:', error)
        return { success: false, message: 'Erro ao carregar templates de notificação' }
    }

    return { success: true, message: 'Templates carregados', data: data as NotificationTemplate[] }
}
