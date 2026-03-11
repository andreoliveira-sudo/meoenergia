import { type NextRequest, NextResponse } from "next/server"
import { validateApiKey, logApiRequest } from "@/lib/auth/api-auth"
import { createAdminClient } from "@/lib/supabase/admin" 
import { getPfRates, getPjRates } from '@/actions/rates'
import { calculateInstallmentPayment } from '@/lib/utils'

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

        if (!validation.isValid || !validation.user || !apiKeyId) {
            status = 401
            return NextResponse.json(
                { error: { code: "UNAUTHORIZED", message: validation.error || "Acesso negado." } },
                { status: 401 }
            )
        }

        const supabase = createAdminClient()

        // 2. Buscar taxas PF e PJ de uma vez
        const [pfRatesResponse, pjRatesResponse] = await Promise.all([getPfRates(), getPjRates()])
        const pfRates = pfRatesResponse.success ? pfRatesResponse.data : null
        const pjRates = pjRatesResponse.success ? pjRatesResponse.data : null

        // 3. Determinar se é busca por ID ou por documento
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
        const cleanedDoc = id.replace(/\D/g, '') 
        const isDocument = (cleanedDoc.length === 11 || cleanedDoc.length === 14) 

        let query = (supabase
            .from("orders") as any)
            .select(`
                id,
                kdi,
                system_power,
                current_consumption,
                connection_voltage,
                equipment_value,
                labor_value,
                other_costs,
                created_at,
                updated_at,
                status,
                payment_day,
                financing_term,
                monthly_bill_value,
                api_key_id,
                notes,
                customers (
                    id,
                    type,
                    cpf,
                    cnpj,
                    name,
                    company_name,
                    contact_name,
                    contact_email,
                    contact_phone,
                    city,
                    state,
                    postal_code,
                    street,
                    number,
                    neighborhood,
                    complement,
                    marital_status,
                    birth_date,
                    gender,
                    occupation,
                    partners (
                        id,
                        contact_name,
                        legal_business_name
                    )
                ),
                sellers:seller_id (
                    id,
                    name
                )
            `)
            .eq("api_key_id", apiKeyId)  

        // Aplicar filtro baseado no tipo de busca
        if (isUUID) {
            query = query.eq("id", id)
        } else if (isDocument) {             
            let customerQuery = (supabase
                .from("customers") as any)
                .select("id")
                .eq("api_key_id", apiKeyId)  
            
            if (cleanedDoc.length === 11) {
                customerQuery = customerQuery.eq("cpf", cleanedDoc)
            } else {
                customerQuery = customerQuery.eq("cnpj", cleanedDoc)
            }
            
            const { data: customerData, error: customerError } = await customerQuery.single()
            
            if (customerError || !customerData) {
                status = 404
                return NextResponse.json(
                    { error: { code: "NOT_FOUND", message: "Cliente não encontrado ou acesso não autorizado." } },
                    { status: 404 }
                )
            }
            
            query = query.eq("customer_id", customerData.id)
        } else {
            status = 400
            return NextResponse.json(
                { 
                    error: { 
                        code: "INVALID_PARAMETER", 
                        message: "Parâmetro inválido. Use ID do pedido (UUID) ou documento (CPF/CNPJ)." 
                    } 
                },
                { status: 400 }
            )
        }

        const { data, error } = await query.single()

        if (error || !data) {
            console.error('Query error:', error)
            
            if (error?.code === 'PGRST116') {
                status = 404
                return NextResponse.json(
                    { error: { code: "NOT_FOUND", message: "Pedido não encontrado ou acesso não autorizado." } },
                    { status: 404 }
                )
            }

            status = 500
            return NextResponse.json(
                { error: { code: "INTERNAL_ERROR", message: "Erro ao buscar detalhes do pedido." } },
                { status: 500 }
            )
        }

        // 4. Verificar se o pedido pertence à API Key (segunda validação)
        if (!data.api_key_id || data.api_key_id !== apiKeyId) {
            status = 403
            return NextResponse.json(
                { 
                    error: { 
                        code: "FORBIDDEN", 
                        message: "Acesso negado. Este pedido não foi criado por esta chave de API." 
                    } 
                },
                { status: 403 }
            )
        }

        // 5. Formatar datas se existirem
        const formattedBirthDate = data.customers?.birth_date 
            ? new Date(data.customers.birth_date).toISOString().split('T')[0]
            : null

        // 6. Calcular simulações para PF e PJ
        const isPj = data.customers?.type === 'pj'
        const rates = isPj ? pjRates : pfRates

        let simulation = null
        if (rates) {
            const equipmentValue = data.equipment_value || 0
            const laborValue = data.labor_value || 0
            const otherCosts = data.other_costs || 0
            const investmentValue = equipmentValue + laborValue + otherCosts

            const managementFeePercent = isPj ? (rates.pj_management_fee || 4) : (rates.pf_management_fee || 8)
            const managementFeeValue = investmentValue * (managementFeePercent / 100)
            const serviceFeePercent = isPj ? (rates.pj_service_fee || 8) : (rates.pf_service_fee || 8)
            const serviceFeeValue = (investmentValue + managementFeeValue) * (serviceFeePercent / 100)
            const totalInvestment = investmentValue + managementFeeValue + serviceFeeValue

            const months = isPj ? [24, 36, 48, 60] : [24, 30, 36, 48, 60, 72, 84, 96]
            const monthlyRates: Record<number, number> = isPj
                ? {
                    24: rates.pj_interest_rate_24 || 2.5,
                    36: rates.pj_interest_rate_36 || 2.5,
                    48: rates.pj_interest_rate_48 || 2.5,
                    60: rates.pj_interest_rate_60 || 2.5,
                }
                : {
                    24: rates.pf_interest_rate_24 || 1.49,
                    30: rates.pf_interest_rate_30 || 1.49,
                    36: rates.pf_interest_rate_36 || 1.60,
                    48: rates.pf_interest_rate_48 || 1.64,
                    60: rates.pf_interest_rate_60 || 1.68,
                    72: rates.pf_interest_rate_72 || 1.72,
                    84: rates.pf_interest_rate_84 || 1.76,
                    96: rates.pf_interest_rate_96 || 1.80,
                }

            const defaultRate = isPj ? 2.5 : 1.5
            const installments = months.map(month => {
                const rate = (monthlyRates[month] || defaultRate) / 100
                const installment = calculateInstallmentPayment({
                    numberOfPeriods: month,
                    presentValue: totalInvestment,
                    rate
                })
                return {
                    term_months: month,
                    interest_rate_percent: monthlyRates[month] || defaultRate,
                    monthly_installment: Number(installment.toFixed(2))
                }
            })

            simulation = {
                investment_value: Number(investmentValue.toFixed(2)),
                management_fee_percent: managementFeePercent,
                management_fee_value: Number(managementFeeValue.toFixed(2)),
                service_fee_percent: serviceFeePercent,
                service_fee_value: Number(serviceFeeValue.toFixed(2)),
                total_investment: Number(totalInvestment.toFixed(2)),
                installments
            }
        }

        // 7. Formatar resposta
        const responseData = {
            id: data.id,
            kdi: data.kdi,
            system_power: data.system_power,
            current_consumption: data.current_consumption,
            connection_voltage: data.connection_voltage || "000",
            equipment_value: data.equipment_value || 0,
            labor_value: data.labor_value || 0,
            other_costs: data.other_costs || 0,          
            payment_day: data.payment_day || 15,
            financing_term: data.financing_term || 60,
            monthly_bill_value: data.monthly_bill_value || 0, 
            status: data.status,
            customers: data.customers ? {
                type: data.customers.type,
                document: data.customers.type === 'pf' 
                    ? (data.customers.cpf || '') 
                    : (data.customers.cnpj || ''),
                name: data.customers.type === 'pf'
                    ? (data.customers.name || '')
                    : (data.customers.company_name || ''),
                ...(data.customers.type === 'pf' ? {
                    cpf: data.customers.cpf || '',
                    individual_name: data.customers.name || '',
                    marital_status: data.customers.marital_status || null,
                    birth_date: formattedBirthDate,
                    gender: data.customers.gender || null,
                    occupation: data.customers.occupation || null
                } : {
                    cnpj: data.customers.cnpj || '',
                    company_name: data.customers.company_name || ''
                }),
                contact_name: data.customers.contact_name || '',
                contact_email: data.customers.contact_email || '',
                contact_phone: data.customers.contact_phone || '',
                address: {
                    postal_code: data.customers.postal_code || '',
                    street: data.customers.street || '',
                    number: data.customers.number || '',
                    complement: data.customers.complement || '',
                    neighborhood: data.customers.neighborhood || '',
                    city: data.customers.city || '',
                    state: data.customers.state || ''
                },
                partner: data.customers.partners ? {
                    contact_name: data.customers.partners.contact_name || '',
                    legal_business_name: data.customers.partners.legal_business_name || ''
                } : null
            } : null,
            sellers: data.sellers ? {
                name: data.sellers.name || ''
            } : null,
            simulation,
            created_at: data.created_at,
            updated_at: data.updated_at,  
        }
 
        return NextResponse.json({
            data: responseData
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