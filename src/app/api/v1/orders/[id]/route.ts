import { type NextRequest, NextResponse } from "next/server"
import { validateApiKey, logApiRequest } from "@/lib/auth/api-auth"
import { createClient } from "@/lib/supabase/server"

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    const start = Date.now()
    let status = 200
    let apiKeyId: string | undefined
    let userId: string | undefined

    try {
        // 1. Validate API Key
        const validation = await validateApiKey(request, 'orders:read')
        apiKeyId = validation.apiKeyId
        userId = validation.user?.id

        if (!validation.isValid || !validation.user) {
            status = 401
            return NextResponse.json(
                { error: { code: "UNAUTHORIZED", message: validation.error || "Acesso negado." } },
                { status: 401 }
            )
        }

        const supabase = await createClient()

        // 2. Fetch Order Details with Ownership Check
        const { data, error } = await supabase
            .from("orders")
            .select(`
                *,
                customers (
                    id, cnpj, company_name, city, state, postal_code, street, number, neighborhood,
                    partners ( contact_name, legal_business_name )
                ),
                sellers ( name ),
                created_by:created_by_user_id ( name )
            `)
            .eq("id", id)
            .eq("created_by_user_id", userId!) // Security check
            .single()

        if (error) {
            // Distinguish between Not Found (often code 'PGRST116' for single()) and actual errors
            if (error.code === 'PGRST116') {
                status = 404
                return NextResponse.json(
                    { error: { code: "NOT_FOUND", message: "Pedido não encontrado ou acesso não autorizado." } },
                    { status: 404 }
                )
            }

            console.error("API Order Detail Error:", error)
            status = 500
            return NextResponse.json(
                { error: { code: "INTERNAL_ERROR", message: "Erro ao buscar detalhes do pedido." } },
                { status: 500 }
            )
        }

        // 3. Format Response (Return raw structure or mapped one - keeping it clean)
        return NextResponse.json({
            data: data
        })

    } catch (error) {
        console.error("API Unexpected Error:", error)
        status = 500
        return NextResponse.json(
            { error: { code: "INTERNAL_ERROR", message: "Erro interno do servidor." } },
            { status: 500 }
        )
    } finally {
        const duration = Date.now() - start
        if (apiKeyId) {
            await logApiRequest(apiKeyId, 'GET', `/api/v1/orders/${id}`, status, userId, duration)
        }
    }
}
