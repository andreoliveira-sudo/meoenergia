import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export type ApiScope = 'orders:read' | 'orders:write' | 'partners:read' | 'partners:write' | 'simulations:read' | 'simulations:write' | 'data:read' | 'data:write' | '*'

export async function validateApiKey(req: NextRequest, requiredScope: ApiScope): Promise<{ isValid: boolean, user?: any, error?: string, apiKeyId?: string }> {
    const apiKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '')
 
    if (!apiKey) { 
        return { isValid: false, error: 'API Key missing' }
    }

    // Hashcheck
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex') 

    // ✅ USAR ADMIN CLIENT EM VEZ DO CLIENT NORMAL
    const supabase = createAdminClient() 
  
    // BUSCAR A CHAVE ESPECÍFICA
    const { data: keyRecord, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('key_hash', keyHash)
        .eq('is_active', true)
        .single()

    if (error || !keyRecord) {
        console.log('4. ❌ VALIDAÇÃO FALHOU')
        console.log('   Erro Supabase:', error?.message || 'Nenhum')
        console.log('   Chave encontrada:', keyRecord ? 'Sim' : 'Não')
        return { isValid: false, error: 'Invalid API Key' }
    } 

    // Scope check
    // @ts-ignore
    const scopes = keyRecord.scopes || [] 
    
    if (!scopes.includes('*') && !scopes.includes(requiredScope)) { 
        return { isValid: false, error: `Missing scope: ${requiredScope}`, apiKeyId: keyRecord.id }
    } 

    // Update last_used_at (fire and forget)
    supabase.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', keyRecord.id).then()

    return { isValid: true, user: { id: keyRecord.user_id }, apiKeyId: keyRecord.id }
}

export async function logApiRequest(
    apiKeyId: string | undefined,
    method: string,
    path: string,
    status: number,
    userId?: string,
    duration: number = 0
) {
    if (!apiKeyId) return
    // Use Admin Client to bypass RLS for logging
    const supabase = createAdminClient()
    try {
        // @ts-ignore
        await supabase.from('api_logs').insert({
            api_key_id: apiKeyId,
            user_id: userId,
            method,
            path,
            status_code: status,
            duration_ms: duration
        })
    } catch (e) {
        console.error('Log failed', e)
    }
}
