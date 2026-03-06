'use server'

import { createClient } from '@/lib/supabase/server'
import { ActionResponse } from '@/types/action-response'

export interface ApiUsageStats {
    total_requests: number
    avg_duration: number
    errors: number
    requests_by_day: { date: string, count: number }[]
}

export default async function getApiUsageStats(): Promise<ActionResponse<ApiUsageStats>> {
    const supabase = await createClient()

    try {
        // Total Requests (Last 30 days)
        const { count: total, error: countError } = await supabase
            // @ts-ignore
            .from('api_logs')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

        if (countError) throw countError

        // Error Rate
        const { count: errors } = await supabase
            // @ts-ignore
            .from('api_logs')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
            .gte('status_code', 400)

        // Requests by Day (Aggregation needs raw SQL or JS processing. Doing JS for simplicity on small scale, or RPC ideally)
        // For now, let's fetch last 7 days logs light (just created_at) to aggregate in JS.
        // Note: For high scale, use an RPC function.
        const { data: logs } = await supabase
            // @ts-ignore
            .from('api_logs')
            .select('created_at, duration_ms')
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

        const requestsByDayMap = new Map<string, number>()
        let totalDuration = 0
        let durationCount = 0

        logs?.forEach(log => {
            if (!log.created_at) return
            const date = log.created_at.split('T')[0] // YYYY-MM-DD
            requestsByDayMap.set(date, (requestsByDayMap.get(date) || 0) + 1)

            if (log.duration_ms) {
                totalDuration += log.duration_ms
                durationCount++
            }
        })

        const requests_by_day = Array.from(requestsByDayMap.entries())
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date))

        const avg_duration = durationCount > 0 ? Math.round(totalDuration / durationCount) : 0

        return {
            success: true,
            message: 'Estatísticas carregadas.',
            data: {
                total_requests: total || 0,
                avg_duration,
                errors: errors || 0,
                requests_by_day
            }
        }

    } catch (error: any) {
        console.error('Erro em getApiUsageStats:', error)
        return { success: false, message: error.message }
    }
}
