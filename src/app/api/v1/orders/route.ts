import { type NextRequest, NextResponse } from "next/server"
import { validateApiKey, logApiRequest } from "@/lib/auth/api-auth"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
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

        // 2. Parse Query Params
        const searchParams = request.nextUrl.searchParams
        const page = Math.max(1, Number(searchParams.get("page") || "1"))
        const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || "20")))
        const offset = (page - 1) * limit

        // 3. Query Orders with Ownership Filter (RLS Manual enforcement if needed, but RLS policy usually handles it too)
        // We enforce .eq('created_by_user_id') explicitly for double safety
        const { data, error, count } = await supabase
            .from("orders")
            .select(
                "id, kdi, status, equipment_value, labor_value, other_costs, created_at, system_power, notes, customers!inner(company_name, cnpj)",
                { count: "exact" }
            )
            .eq("created_by_user_id", userId!)
            .range(offset, offset + limit - 1)
            .order("created_at", { ascending: false })

        if (error) {
            console.error("API Orders Error:", error)
            status = 500
            return NextResponse.json(
                { error: { code: "INTERNAL_ERROR", message: "Erro ao buscar pedidos." } },
                { status: 500 }
            )
        }

        // 4. Format Response
        const formattedData = data?.map(order => {
            const subtotal = (order.equipment_value || 0) + (order.labor_value || 0) + (order.other_costs || 0)
            // Note: service_fee calculation omitted for brevity, adding if needed or just raw values

            return {
                id: order.id,
                kdi: order.kdi,
                status: order.status,
                customer: order.customers ? {
                    company_name: order.customers.company_name,
                    cnpj: order.customers.cnpj
                } : null,
                financials: {
                    equipment: order.equipment_value,
                    labor: order.labor_value,
                    other: order.other_costs,
                    subtotal
                },
                system_power: order.system_power,
                created_at: order.created_at,
                notes: order.notes
            }
        })

        return NextResponse.json({
            data: formattedData,
            meta: {
                page,
                limit,
                total: count,
                totalPages: count ? Math.ceil(count / limit) : 0
            }
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
            await logApiRequest(apiKeyId, 'GET', '/api/v1/orders', status, userId, duration)
        }
    }
}
