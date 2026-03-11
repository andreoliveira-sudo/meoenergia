'use server'

import { createClient } from '@/lib/supabase/server'
import { ActionResponse } from '@/types/action-response'
import crypto from 'crypto'

import hasPermission from '@/actions/auth/has-permissions'

export default async function createApiKey({ 
    name, 
    scopes, 
    partnerId,
    internalManagerId,
    webhookUrl,
    userId 
}: { 
    name: string
    scopes: string[]
    partnerId?: string  // ✅ Agora opcional
    internalManagerId?: string  // ✅ Agora opcional
    webhookUrl?: string 
    userId?: string 
}): Promise<ActionResponse<{ key: string }>> {
    const supabase = await createClient()

    // 1. Authenticate Request
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { success: false, message: 'Usuário não autenticado.' }
    }

    let targetUserId = user.id

    // 2. Validate User ID Override (Only Admins)
    if (userId && userId !== user.id) {
        const canManageUsers = await hasPermission('admin:users:manage')
        if (!canManageUsers) {
            return { success: false, message: 'Você não tem permissão para criar chaves para outros usuários.' }
        }
        targetUserId = userId
    }

    // 3. Validate Scopes (Prevent escalation)
    if (scopes.includes('*')) {
        const isSuperAdmin = await hasPermission('admin:settings:manage')
        if (!isSuperAdmin) {
            return { success: false, message: 'Você não tem permissão para criar chaves de Admin (*).' }
        }
    }

    // ✅ 4. Buscar partnerId se não fornecido
    let finalPartnerId = partnerId
    if (!finalPartnerId) {
        const { data: partner } = await supabase
            .from('partners')
            .select('id')
            .eq('user_id', targetUserId)
            .maybeSingle()
        
        finalPartnerId = partner?.id || ""
    }

    // ✅ 5. Buscar internalManagerId se não fornecido
    let finalInternalManagerId = internalManagerId
    if (!finalInternalManagerId) {
        const { data: seller } = await supabase
            .from('sellers')
            .select('id')
            .eq('user_id', targetUserId)
            .maybeSingle()
        
        finalInternalManagerId = seller?.id || ""
    }

    // ✅ 6. Validar que pelo menos um dos dois existe
    if (!finalPartnerId && !finalInternalManagerId) {
        return { 
            success: false, 
            message: 'Usuário não possui vínculo com parceiro ou vendedor. Configure um parceiro ou vendedor primeiro.' 
        }
    }

    // Gerar Chave
    const rawKey = 'meo_sk_' + crypto.randomBytes(24).toString('hex')
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex')
    const keyPrefix = rawKey.substring(0, 15)

    try {
        const { error } = await supabase.from('api_keys').insert({
            user_id: targetUserId,
            name,
            scopes,
            partner_id: finalPartnerId, // ✅ Pode ser null
            internal_manager_id: finalInternalManagerId, // ✅ Pode ser null
            webhook_url: webhookUrl || null,
            key_prefix: keyPrefix,
            key_hash: keyHash,
            is_active: true
        })

        if (error) {
            console.error('Erro ao criar API Key:', error)
            return { success: false, message: error.message }
        }

        return { success: true, message: 'Chave criada com sucesso.', data: { key: rawKey } }
    } catch (error) {
        console.error('Erro inesperado em createApiKey:', error)
        return { success: false, message: 'Erro inesperado.' }
    }
}