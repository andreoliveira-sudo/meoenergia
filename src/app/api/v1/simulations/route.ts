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

        // 2. Parse Query Params
        const searchParams = request.nextUrl.searchParams
        const page = Math.max(1, Number(searchParams.get("page") || "1"))
        const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || "20")))
        const offset = (page - 1) * limit

        const supabase = await createClient()

        // 3. Query Simulations
        const { data, error, count } = await supabase
            .from("simulations")
            .select(
                "id, kdi, status, system_power, equipment_value, labor_value, other_costs, created_at, customers!inner(company_name, cnpj)",
                { count: "exact" }
            )
            .eq("created_by_user_id", userId!)
            .range(offset, offset + limit - 1)
            .order("created_at", { ascending: false })

        if (error) {
            console.error("API Simulations Error:", error)
            status = 500
            return NextResponse.json(
                { error: { code: "INTERNAL_ERROR", message: "Erro ao buscar simulações." } },
                { status: 500 }
            )
        }

        // 4. Format Data
        const formattedData = data?.map(sim => {
            const subtotal = (sim.equipment_value || 0) + (sim.labor_value || 0) + (sim.other_costs || 0)

            return {
                id: sim.id,
                kdi: sim.kdi,
                status: sim.status,
                customer: sim.customers ? {
                    company_name: sim.customers.company_name,
                    cnpj: sim.customers.cnpj
                } : null,
                financials: {
                    equipment: sim.equipment_value,
                    labor: sim.labor_value,
                    other: sim.other_costs,
                    subtotal
                },
                system_power: sim.system_power,
                created_at: sim.created_at
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
        // Log Request
        if (apiKeyId) {
            await logApiRequest(apiKeyId, 'GET', '/api/v1/simulations', status, userId, duration)
        }
    }
}
