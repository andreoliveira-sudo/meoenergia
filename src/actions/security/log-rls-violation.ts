'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse } from '@/types/action-response'

/**
 * Registra uma violação de RLS no audit log.
 * Chamado quando uma query retorna vazio devido a RLS (PGRST116 ou 0 rows).
 */
export default async function logRLSViolation({
    tableName,
    operation,
    attemptedRowId,
    reason,
}: {
    tableName: string
    operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'
    attemptedRowId?: string
    reason?: string
}): Promise<ActionResponse<null>> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, message: 'Usuário não autenticado' }
        }

        const { error } = await supabase
            .from('rls_violation_audit')
            .insert({
                user_id: user.id,
                table_name: tableName,
                operation,
                attempted_row_id: attemptedRowId || null,
                reason: reason || 'RLS policy violation',
            })

        if (error) {
            console.error('Failed to log RLS violation:', error)
            return { success: false, message: 'Erro ao registrar violação de RLS' }
        }

        return { success: true, message: 'Violação registrada', data: null }
    } catch (err) {
        console.error('Error in logRLSViolation:', err)
        return { success: false, message: 'Erro interno ao registrar violação' }
    }
}
