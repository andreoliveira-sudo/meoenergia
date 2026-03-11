import { type NextRequest, NextResponse } from "next/server"
import { validateApiKey, logApiRequest } from "@/lib/auth/api-auth"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
    const start = Date.now()
    let status = 200
    let apiKeyId: string | undefined
    let userId: string | undefined

    try {
        // 1. Validar API Key (qualquer chave ativa pode ver seus dados)
        const validation = await validateApiKey(request, 'data:read')
        apiKeyId = validation.apiKeyId
        userId = validation.user?.id

        if (!validation.isValid || !validation.apiKeyId) {
            status = 401
            return NextResponse.json(
                { error: { code: "UNAUTHORIZED", message: validation.error || "Chave de API inválida ou expirada." } },
                { status: 401 }
            )
        }

        const supabase = await createAdminClient()

        // 2. Buscar dados da chave específica
        const { data: apiKeyData, error: apiKeyError } = (await supabase
            .from('api_keys')
            .select(`
                id,
                name,
                key_prefix,
                scopes,
                last_used_at,
                created_at,
                is_active,
                webhook_url,
                partner_id,
                internal_manager_id,
                partners!inner (
                    legal_business_name, 
                    cnpj
                ),
                sellers!inner (
                    name,
                    email
                )
            `)
            .eq('id', validation.apiKeyId)
            .single()) as any

        if (apiKeyError) {
            console.error('Erro ao buscar dados da API Key:', apiKeyError)
            status = 404
            return NextResponse.json(
                { error: { code: "NOT_FOUND", message: "Chave de API não encontrada." } },
                { status: 404 }
            )
        }

        // 3. Formatar resposta
        const response = {
            data: { 
                name: apiKeyData.name,
                key_prefix: apiKeyData.key_prefix,
                scopes: apiKeyData.scopes || [],
                status: apiKeyData.is_active ? "active" : "inactive",
                last_used_at: apiKeyData.last_used_at,
                created_at: apiKeyData.created_at,
                webhook_url: apiKeyData.webhook_url,
                partner: apiKeyData.partners ? { 
                    name: apiKeyData.partners.legal_business_name || "N/A",
                    cnpj: apiKeyData.partners.cnpj || "N/A"
                } : null,
                internal_manager: apiKeyData.sellers ? { 
                    name: apiKeyData.sellers.name || "N/A",
                    email: apiKeyData.sellers.email
                } : null
            },
            meta: {
                expires_in: "never", 
                can_update: ["webhook_url"]
            }
        }

        return NextResponse.json(response)

    } catch (error) {
        console.error("API Data GET Unexpected Error:", error)
        status = 500
        return NextResponse.json(
            { error: { code: "INTERNAL_ERROR", message: "Erro interno do servidor." } },
            { status: 500 }
        )
    } finally {
        const duration = Date.now() - start
        if (apiKeyId) {
            await logApiRequest(apiKeyId, 'GET', '/api/v1/data', status, userId, duration)
        }
    }
}

export async function POST(request: NextRequest) {
    const start = Date.now()
    let status = 200
    let apiKeyId: string | undefined
    let userId: string | undefined

    try {
        // 1. Validar API Key
        const validation = await validateApiKey(request, 'data:write')
        apiKeyId = validation.apiKeyId
        userId = validation.user?.id

        if (!validation.isValid || !validation.apiKeyId) {
            status = 401
            return NextResponse.json(
                { error: { code: "UNAUTHORIZED", message: validation.error || "Chave de API inválida ou expirada." } },
                { status: 401 }
            )
        }

        // 2. Verificar se a chave está ativa — buscar estado da chave no banco
        const supabase = await createAdminClient()
        const { data: existingKey, error: existingKeyError } = await supabase
            .from('api_keys')
            .select('id, is_active, webhook_url')
            .eq('id', validation.apiKeyId)
            .single() as any

        if (existingKeyError || !existingKey) {
            console.error('Erro ao buscar dados da API Key:', existingKeyError)
            status = 404
            return NextResponse.json(
                { error: { code: "NOT_FOUND", message: "Chave de API não encontrada." } },
                { status: 404 }
            )
        }

        if (!existingKey.is_active) {
            status = 403
            return NextResponse.json(
                { error: { code: "FORBIDDEN", message: "Esta chave de API está desativada." } },
                { status: 403 }
            )
        }

        // 3. Parse do body
        const body = await request.json()
        
        // 4. Validar que apenas webhook_url pode ser atualizado
        const allowedFields = ['webhook_url']
        const providedFields = Object.keys(body)
        
        const invalidFields = providedFields.filter(field => !allowedFields.includes(field))
        if (invalidFields.length > 0) {
            status = 400
            return NextResponse.json(
                { 
                    error: { 
                        code: "INVALID_FIELD", 
                        message: `Apenas os seguintes campos podem ser atualizados: ${allowedFields.join(', ')}`,
                        invalid_fields: invalidFields
                    } 
                },
                { status: 400 }
            )
        }

        // 5. Validar webhook_url se fornecido
        if (body.webhook_url !== undefined) {
            // Pode ser string vazia para remover
            if (body.webhook_url !== '' && body.webhook_url !== null) {
                // Validar URL
                try {
                    const url = new URL(body.webhook_url)
                    if (!['http:', 'https:'].includes(url.protocol)) {
                        status = 400
                        return NextResponse.json(
                            { error: { code: "INVALID_URL", message: "A URL do webhook deve usar HTTP ou HTTPS." } },
                            { status: 400 }
                        )
                    }
                } catch {
                    status = 400
                    return NextResponse.json(
                        { error: { code: "INVALID_URL", message: "URL do webhook inválida." } },
                        { status: 400 }
                    )
                }
            }
        }

        // 6. Atualizar apenas o campo permitido
        const updateData: any = {}
        if (body.webhook_url !== undefined) {
            updateData.webhook_url = body.webhook_url === '' ? null : body.webhook_url
        }

        // Se não há nada para atualizar
        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({
                success: true,
                message: "Nenhuma alteração necessária.",
                data: null
            })
        }

        // 7. Executar atualização
        const updateResult = await supabase
            .from('api_keys')
            .update(updateData)
            .eq('id', validation.apiKeyId)
            .select('id, webhook_url')
            .single() as any

        const updatedData = updateResult.data
        const updateError = updateResult.error

        if (updateError || !updatedData) {
            console.error('Erro ao atualizar API Key:', updateError)
            status = 400
            return NextResponse.json(
                { error: { code: "UPDATE_ERROR", message: "Erro ao atualizar dados da chave." } },
                { status: 400 }
            )
        }

        // 8. Registrar log de alteração
        const { error: logError } = await supabase
            .from('api_key_logs' as any)
            .insert({
                api_key_id: validation.apiKeyId,
                action: 'UPDATE_WEBHOOK',
                old_value: existingKey.webhook_url || null,
                new_value: updateData.webhook_url,
                changed_by: `api_key:${validation.apiKeyId}`,
                ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
            })

        if (logError) {
            console.error('Erro ao registrar log:', logError)
            // Não falhar por causa do log
        }

        // 9. Resposta de sucesso
        const response = {
            success: true,
            message: "Dados atualizados com sucesso.",
            data: {
                id: updatedData.id,
                webhook_url: updatedData.webhook_url, 
            }
        }

        return NextResponse.json(response)

    } catch (error) {
        console.error("API Data POST Unexpected Error:", error)
        status = 500
        return NextResponse.json(
            { error: { code: "INTERNAL_ERROR", message: "Erro interno do servidor." } },
            { status: 500 }
        )
    } finally {
        const duration = Date.now() - start
        if (apiKeyId) {
            await logApiRequest(apiKeyId, 'POST', '/api/v1/data', status, userId, duration)
        }
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
            'Access-Control-Allow-Origin': '*',
        },
    })
}