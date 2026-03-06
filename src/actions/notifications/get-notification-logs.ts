'use server'

import { createClient } from '@/lib/supabase/server'
import { ActionResponse } from '@/types/action-response'

export interface NotificationLog {
    id: string
    recipient_name: string
    recipient_phone: string
    channel: 'whatsapp' | 'internal'
    content: string
    status: 'sent' | 'failed'
    error_message?: string
    created_at: string
    triggered_by_user: {
        name: string
        email: string
    } | null
    order_id?: string
}

interface GetNotificationLogsParams {
    page?: number
    limit?: number
}

export default async function getNotificationLogs({ page = 1, limit = 10 }: GetNotificationLogsParams = {}): Promise<ActionResponse<{ logs: NotificationLog[], total: number, totalPages: number }>> {
    try {
        const supabase = await createClient()
        const offset = (page - 1) * limit

        // Buscar logs com paginação e o nome do autor
        const { data, error, count } = await supabase
            // @ts-ignore
            .from('notification_logs')
            .select(`
                *,
                triggered_by_user:users(name, email)
            `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)

        if (error) {
            console.error('Erro ao buscar logs de notificação:', error)
            return { success: false, message: 'Erro ao buscar histórico de notificações.' }
        }

        // Mapear para o formato correto (tratando o join)
        const logs: NotificationLog[] = data.map((log: any) => ({
            id: log.id,
            recipient_name: log.recipient_name,
            recipient_phone: log.recipient_phone,
            channel: log.channel,
            content: log.content,
            status: log.status,
            error_message: log.error_message,
            created_at: log.created_at,
            triggered_by_user: log.triggered_by_user || null,
            order_id: log.order_id
        }))

        const totalPages = count ? Math.ceil(count / limit) : 0

        return {
            success: true,
            message: 'Logs recuperados com sucesso.',
            data: {
                logs,
                total: count || 0,
                totalPages
            }
        }
    } catch (error) {
        console.error('Erro inesperado em getNotificationLogs:', error)
        return { success: false, message: 'Ocorreu um erro inesperado.' }
    }
}
