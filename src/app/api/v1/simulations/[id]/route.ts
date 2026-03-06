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
        const validation = await validateApiKey(request, 'simulations:read')
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

        // 2. Fetch Simulation Details with Ownership Check
        const { data, error } = await supabase
            .from("simulations")
            .select(`
                id, kdi, status, system_power, equipment_value, labor_value, other_costs, created_at,
                customers (
                    company_name, cnpj, city, state, postal_code
                )
            `)
            .eq("id", id)
            .eq("created_by_user_id", userId!) // Security check
            .single()

        if (error) {
            // Distinguish between Not Found and actual errors
            if (error.code === 'PGRST116') {
                status = 404
                return NextResponse.json(
                    { error: { code: "NOT_FOUND", message: "Simulação não encontrada ou acesso não autorizado." } },
                    { status: 404 }
                )
            }

            console.error("API Simulation Detail Error:", error)
            status = 500
            return NextResponse.json(
                { error: { code: "INTERNAL_ERROR", message: "Erro ao buscar detalhes da simulação." } },
                { status: 500 }
            )
        }

        // 3. Format Response
        const subtotal = (data.equipment_value || 0) + (data.labor_value || 0) + (data.other_costs || 0)

        const formattedData = {
            id: data.id,
            kdi: data.kdi,
            status: data.status,
            customer: data.customers ? {
                company_name: data.customers.company_name,
                cnpj: data.customers.cnpj,
                city: data.customers.city, // Extra details for single view if available
                state: data.customers.state
            } : null,
            financials: {
                equipment: data.equipment_value,
                labor: data.labor_value,
                other: data.other_costs,
                subtotal
            },
            system_power: data.system_power,
            created_at: data.created_at
        }

        return NextResponse.json({
            data: formattedData
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
            await logApiRequest(apiKeyId, 'GET', `/api/v1/simulations/${id}`, status, userId, duration)
        }
    }
}
