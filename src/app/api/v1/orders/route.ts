import { type NextRequest, NextResponse } from "next/server"
import { validateApiKey, logApiRequest } from "@/lib/auth/api-auth"
import { createAdminClient } from "@/lib/supabase/admin"  
import { getPfRates, getPjRates } from '@/actions/rates'
import { calculateInstallmentPayment } from '@/lib/utils'

export async function GET(request: NextRequest) {
    const start = Date.now()
    let status = 200
    let apiKeyId: string | undefined 

    try {
        // 1. Validate API Key
        const validation = await validateApiKey(request, 'orders:read')
        apiKeyId = validation.apiKeyId 

        if (!validation.isValid || !apiKeyId) {
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

        // 3. Parse Query Params
        const searchParams = request.nextUrl.searchParams
        const page = Math.max(1, Number(searchParams.get("page") || "1"))
        const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || "20")))
        const offset = (page - 1) * limit

        // 4. Query Orders with API Key Filter
        const { data, error, count } = await (supabase
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
                notes,
                customers!inner (
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
            `, { count: "exact" })
            .eq("api_key_id", apiKeyId) 
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

        // 5. Format Response com simulações
        const formattedData = data?.map((order: any) => {
            // Determinar documento baseado no tipo
            const document = order.customers?.type === 'pf' 
                ? (order.customers?.cpf || '') 
                : (order.customers?.cnpj || '')
            
            // Determinar nome baseado no tipo
            const customerName = order.customers?.type === 'pf'
                ? (order.customers?.name || '')
                : (order.customers?.company_name || '')

            // Formatar data de nascimento se existir
            const formattedBirthDate = order.customers?.birth_date 
                ? new Date(order.customers.birth_date).toISOString().split('T')[0]
                : null

            const isPj = order.customers?.type === 'pj'
            const rates = isPj ? pjRates : pfRates

            let simulation = null
            if (rates) {
                const equipmentValue = order.equipment_value || 0
                const laborValue = order.labor_value || 0
                const otherCosts = order.other_costs || 0
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
 
            return {
                id: order.id,
                kdi: order.kdi,
                system_power: order.system_power,
                current_consumption: order.current_consumption,
                connection_voltage: order.connection_voltage || "000",
                equipment_value: order.equipment_value || 0,
                labor_value: order.labor_value || 0,
                other_costs: order.other_costs || 0,                
                payment_day: order.payment_day || 15,
                financing_term: order.financing_term || 60,
                monthly_bill_value: order.monthly_bill_value || 0,
                status: order.status,
                customers: order.customers ? {
                    type: order.customers.type,
                    document: document,
                    name: customerName,
                    
                    // Campos comuns
                    contact_name: order.customers.contact_name || '',
                    contact_email: order.customers.contact_email || '',
                    contact_phone: order.customers.contact_phone || '',
                    
                    // Campos específicos por tipo
                    ...(order.customers.type === 'pf' ? {
                        cpf: order.customers.cpf || '',
                        individual_name: order.customers.name || '',
                        marital_status: order.customers.marital_status || null,
                        birth_date: formattedBirthDate,
                        gender: order.customers.gender || null,
                        occupation: order.customers.occupation || null
                    } : {
                        cnpj: order.customers.cnpj || '',
                        company_name: order.customers.company_name || '',  
                    }),
                    
                    address: {
                        postal_code: order.customers.postal_code || '',
                        street: order.customers.street || '',
                        number: order.customers.number || '',
                        complement: order.customers.complement || '',
                        neighborhood: order.customers.neighborhood || '',
                        city: order.customers.city || '',
                        state: order.customers.state || ''
                    },
                    partner: order.customers.partners ? {
                        contact_name: order.customers.partners.contact_name || '',
                        legal_business_name: order.customers.partners.legal_business_name || ''
                    } : null
                } : null,
                sellers: order.sellers ? {
                    name: order.sellers.name || ''
                } : null,
                simulation,
                created_at: order.created_at,
                updated_at: order.updated_at,
            }
        })

        const response = {
            data: formattedData,
            meta: {
                page,
                limit,
                total: count,
                totalPages: count ? Math.ceil(count / limit) : 0, 
            }
        } 
 
        return NextResponse.json(response)

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
            await logApiRequest(apiKeyId, 'GET', '/api/v1/orders', status, apiKeyId, duration)
        }
    }
}

export async function POST(request: NextRequest) {
    const start = Date.now()
    let status = 201
    let apiKeyId: string | undefined
    let userId: string | undefined

    try {
        // 1. VALIDAÇÃO DA API KEY
        const validation = await validateApiKey(request, 'orders:write') 
        apiKeyId = validation.apiKeyId
        userId = validation.user?.id
 
        if (!validation.isValid || !apiKeyId) {
            status = 401
            return NextResponse.json(
                { error: { code: "UNAUTHORIZED", message: validation.error || "Acesso negado." } },
                { status: 401 }
            )
        }

        const supabase = createAdminClient()

        // 2. PARSE E VALIDAÇÃO DO BODY
        const body = await request.json()
                
        // Validação básica dos campos obrigatórios
        const requiredFields = ['document', 'email', 'phone', 'postal_code', 'street', 'payment_day',
                               'number', 'neighborhood', 'city', 'state', 'current_consumption',
                               'monthly_bill_value', 'system_power', 'equipment_value', 'labor_value']
        
        const missingFields = requiredFields.filter(field => !body[field])
        if (missingFields.length > 0) {
            status = 400
            return NextResponse.json(
                { 
                    error: { 
                        code: "MISSING_FIELDS", 
                        message: `Campos obrigatórios faltando: ${missingFields.join(', ')}` 
                    } 
                },
                { status: 400 }
            )
        }

        // Validação do documento (precisa vir antes da validação do financing_term)
        const cleanedDoc = (body.document || '').replace(/\D/g, '')
        const isPF = cleanedDoc.length === 11
        const isPJ = cleanedDoc.length === 14

        if (!isPF && !isPJ) {
            status = 400
            return NextResponse.json(
                { 
                    error: { 
                        code: "INVALID_DOCUMENT", 
                        message: "Documento inválido. Deve ser CPF (11 dígitos) ou CNPJ (14 dígitos)" 
                    } 
                },
                { status: 400 }
            )
        }

        // Validação do financing_term por tipo de pessoa
        const validFinancingTermsPF = [24, 30, 36, 48, 60, 72, 84, 96]
        const validFinancingTermsPJ = [24, 36, 48, 60]
        const validFinancingTerms = isPF ? validFinancingTermsPF : validFinancingTermsPJ

        if (body.financing_term && !validFinancingTerms.includes(Number(body.financing_term))) {
            status = 400
            return NextResponse.json(
                { 
                    error: { 
                        code: "INVALID_FINANCING_TERM", 
                        message: `Prazo de financiamento inválido para ${isPF ? 'Pessoa Física' : 'Pessoa Jurídica'}. Valores aceitos: ${validFinancingTerms.join(', ')} meses` 
                    } 
                },
                { status: 400 }
            )
        }

        // Validação opcional para estado civil (apenas PF)
        if (isPF && body.marital_status) {
            const validMaritalStatuses = ['single', 'married', 'divorced', 'widowed', 'separated']
            if (!validMaritalStatuses.includes(body.marital_status)) {
                status = 400
                return NextResponse.json(
                    { 
                        error: { 
                            code: "INVALID_MARITAL_STATUS", 
                            message: `Estado civil inválido. Valores aceitos: ${validMaritalStatuses.join(', ')}` 
                        } 
                    },
                    { status: 400 }
                )
            }
        }

        if (isPF && body.gender) {
            const validGenders = ['M', 'F', 'other']
            if (!validGenders.includes(body.gender)) {
                status = 400
                return NextResponse.json(
                    { 
                        error: { 
                            code: "INVALID_GENDER", 
                            message: `Gênero inválido. Valores aceitos: ${validGenders.join(', ')}` 
                        } 
                    },
                    { status: 400 }
                )
            }
        }
        
        // Validação de data de nascimento (apenas para PF)
        if (isPF && body.birth_date) {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/
            if (!dateRegex.test(body.birth_date)) {
                status = 400
                return NextResponse.json(
                    { 
                        error: { 
                            code: "INVALID_BIRTH_DATE", 
                            message: "Data de nascimento inválida. Use o formato YYYY-MM-DD" 
                        } 
                    },
                    { status: 400 }
                )
            }
            
            const date = new Date(body.birth_date)
            if (isNaN(date.getTime())) {
                status = 400
                return NextResponse.json(
                    { 
                        error: { 
                            code: "INVALID_BIRTH_DATE", 
                            message: "Data de nascimento inválida." 
                        } 
                    },
                    { status: 400 }
                )
            }
        }

        // Validação de profissão (apenas para PF)
        if (isPF && body.occupation && body.occupation.length < 3) {
            status = 400
            return NextResponse.json(
                { 
                    error: { 
                        code: "INVALID_OCCUPATION", 
                        message: "Profissão deve ter pelo menos 3 caracteres." 
                    } 
                },
                { status: 400 }
            )
        }

        // 3. BUSCAR TAXAS PF ou PJ conforme tipo
        const ratesResponse = isPF ? await getPfRates() : await getPjRates()
        const rates = ratesResponse.success ? ratesResponse.data : null

        // 4. OBTER DADOS DA API KEY
        const { data: apiKeyData, error: apiKeyError } = await supabase
            .from('api_keys')
            .select('partner_id, internal_manager_id, user_id')
            .eq('id', apiKeyId)
            .single()

        if (apiKeyError || !apiKeyData) {
            console.error('Erro ao buscar dados da API Key:', apiKeyError)
            status = 400
            return NextResponse.json(
                { 
                    error: { 
                        code: "API_KEY_ERROR", 
                        message: "Erro ao validar chave de API." 
                    } 
                },
                { status: 400 }
            )
        }

        const PARTNER_ID = (apiKeyData as any).partner_id
        const INTERNAL_MANAGER_ID = (apiKeyData as any).internal_manager_id
        const API_USER_ID = (apiKeyData as any).user_id
                
        if (!PARTNER_ID || !INTERNAL_MANAGER_ID) {
            status = 400
            return NextResponse.json(
                { 
                    error: { 
                        code: "INVALID_API_KEY", 
                        message: "Chave de API não possui parceiro ou gerente interno configurado." 
                    } 
                },
                { status: 400 }
            )
        }

        // 5. VERIFICAR/CRIAR CLIENTE
        let customerId: string | null = null
        let existingCustomer: any = null

        if (isPF) {
            const { data } = await (supabase
                .from("customers") as any)
                .select("id, partner_id, internal_manager, api_key_id")
                .eq("cpf", cleanedDoc)
                .maybeSingle()
            existingCustomer = data
        } else {
            const { data } = await (supabase
                .from("customers") as any)
                .select("id, partner_id, internal_manager, api_key_id")
                .eq("cnpj", cleanedDoc)
                .maybeSingle()
            existingCustomer = data
        }

        if (existingCustomer) {
            if (existingCustomer.api_key_id && existingCustomer.api_key_id !== apiKeyId) {
                status = 403
                return NextResponse.json(
                    { 
                        error: { 
                            code: "CUSTOMER_ACCESS_DENIED", 
                            message: "Este documento já está registrado por outra chave de API." 
                        } 
                    },
                    { status: 403 }
                )
            }
            customerId = existingCustomer.id
        } else {            
            const customerData: any = {
                type: isPF ? 'pf' : 'pj',
                contact_email: body.email,
                contact_phone: (body.phone || '').replace(/\D/g, ""),
                postal_code: (body.postal_code || '').replace(/\D/g, ""),
                street: body.street,
                number: body.number,
                complement: body.complement || '',
                neighborhood: body.neighborhood,
                city: body.city,
                state: (body.state || '').toUpperCase().substring(0, 2),
                partner_id: PARTNER_ID,
                internal_manager: INTERNAL_MANAGER_ID,
                created_by_user_id: API_USER_ID,
                api_key_id: apiKeyId, 
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                annual_revenue: "0.00",
            }

            if (isPF) {
                customerData.cpf = cleanedDoc
                customerData.name = body.name || body.contact_name || `Cliente PF ${cleanedDoc}`
                customerData.contact_name = body.contact_name || body.name || customerData.name
                customerData.company_name = null
                customerData.cnpj = null
                customerData.incorporation_date = null
                
                if (body.marital_status) customerData.marital_status = body.marital_status
                if (body.birth_date)     customerData.birth_date = body.birth_date
                if (body.gender)         customerData.gender = body.gender
                if (body.occupation)     customerData.occupation = body.occupation
            } else {
                customerData.cnpj = cleanedDoc
                customerData.company_name = body.company_name || `Empresa ${cleanedDoc}`
                customerData.contact_name = body.contact_name || `Contato ${customerData.company_name}`
                customerData.name = null
                customerData.cpf = null
                customerData.incorporation_date = body.incorporation_date || '2000-01-01'
                
                if (body.trading_name)        customerData.trading_name = body.trading_name
                if (body.business_activity)   customerData.business_activity = body.business_activity
                if (body.number_of_employees) customerData.number_of_employees = body.number_of_employees
            }

            const { data: newCustomer, error: createCustomerError } = await supabase
                .from("customers")
                .insert(customerData)
                .select("id")
                .single()

            if (createCustomerError) {
                console.error("Erro ao criar cliente:", createCustomerError)
                status = 400
                return NextResponse.json(
                    { 
                        error: { 
                            code: "CUSTOMER_CREATION_ERROR", 
                            message: "Erro ao criar cliente.",
                            details: createCustomerError.message
                        } 
                    },
                    { status: 400 }
                )
            }
            customerId = newCustomer.id
        }
        
        // 6. CRIAR PEDIDO
        const orderData: any = {
            customer_id: customerId,
            created_by_user_id: API_USER_ID,
            seller_id: INTERNAL_MANAGER_ID,
            api_key_id: apiKeyId, 
            current_consumption: body.current_consumption,
            monthly_bill_value: body.monthly_bill_value,
            system_power: body.system_power,
            equipment_value: body.equipment_value,
            labor_value: body.labor_value,
            status: 'analysis_pending',
            payment_day: body.payment_day || 15,
            financing_term: body.financing_term || (isPF ? 60 : 36),
            other_costs: body.other_costs || 0,
            service_fee_36: 4,
            service_fee_48: 5,
            service_fee_60: 6.3,
            interest_rate_36: 2.3,
            interest_rate_48: 1.95,
            interest_rate_60: 1.9,
            energy_provider: body.energy_provider || '',
            connection_voltage: body.connection_voltage || '000',
            structure_type: body.structure_type || '9f95b191-2781-4ab3-a1e5-149d5d5257c9',
            kit_module_id: body.kit_module_id || 5,
            kit_inverter_id: body.kit_inverter_id || 6,
            kit_others: body.kit_others || null,
            notes: body.notes || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }

        const { data: newOrder, error: createOrderError } = await (supabase
            .from("orders") as any)
            .insert(orderData)
            .select(`
                id,
                kdi,
                status,
                created_at,
                equipment_value,
                labor_value,
                other_costs,
                financing_term,
                payment_day,
                monthly_bill_value,
                current_consumption,
                system_power,
                connection_voltage
            `)
            .single()

        if (createOrderError) {
            console.error("Erro ao criar pedido:", createOrderError)
            status = 400
            return NextResponse.json(
                { 
                    error: { 
                        code: "ORDER_CREATION_ERROR", 
                        message: "Erro ao criar pedido.",
                        details: createOrderError.message
                    } 
                },
                { status: 400 }
            )
        }

        // 7. REGISTRAR HISTÓRICO
        const { error: historyError } = await supabase
            .from("order_history")
            .insert({
                order_id: newOrder.id,
                new_status: 'analysis_pending',
                changed_by: API_USER_ID,
                reason: `Pedido criado via API Key: ${apiKeyId.substring(0, 8)}... - ${isPF ? 'PF' : 'PJ'}`
            })

        if (historyError) {
            console.error("Erro ao criar histórico:", historyError)
        }

        // 8. CALCULAR SIMULAÇÕES (PF e PJ)
        let simulation = null
        if (rates) {
            const equipmentValue = newOrder.equipment_value || 0
            const laborValue = newOrder.labor_value || 0
            const otherCosts = newOrder.other_costs || 0
            const investmentValue = equipmentValue + laborValue + otherCosts

            const managementFeePercent = isPJ ? (rates.pj_management_fee || 4) : (rates.pf_management_fee || 8)
            const managementFeeValue = investmentValue * (managementFeePercent / 100)
            const serviceFeePercent = isPJ ? (rates.pj_service_fee || 8) : (rates.pf_service_fee || 8)
            const serviceFeeValue = (investmentValue + managementFeeValue) * (serviceFeePercent / 100)
            const totalInvestment = investmentValue + managementFeeValue + serviceFeeValue

            const months = isPJ ? [24, 36, 48, 60] : [24, 30, 36, 48, 60, 72, 84, 96]
            const monthlyRates: Record<number, number> = isPJ
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

            const defaultRate = isPJ ? 2.5 : 1.5
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

        // 9. PREPARAR RESPOSTA COMPLETA
        const response = {
            success: true,
            message: `Pedido criado com sucesso para ${isPF ? 'Pessoa Física' : 'Pessoa Jurídica'}`,
            data: {
                id: newOrder.id,
                kdi: newOrder.kdi,
                status: newOrder.status,
                system_power: newOrder.system_power,
                current_consumption: newOrder.current_consumption,
                connection_voltage: newOrder.connection_voltage || "000",
                equipment_value: newOrder.equipment_value || 0,
                labor_value: newOrder.labor_value || 0,
                other_costs: newOrder.other_costs || 0,
                payment_day: newOrder.payment_day || 15,
                financing_term: newOrder.financing_term || (isPF ? 60 : 36),
                monthly_bill_value: newOrder.monthly_bill_value || 0,
                customer_type: isPF ? 'pf' : 'pj',
                document: cleanedDoc,
                simulation,
                created_at: newOrder.created_at,
            }
        }

        return NextResponse.json(response, { status: 201 })

    } catch (error) {
        console.error("API Create Order Unexpected Error:", error)
        status = 500
        return NextResponse.json(
            { error: { code: "INTERNAL_ERROR", message: "Erro interno do servidor." } },
            { status: 500 }
        )
    } finally {
        const duration = Date.now() - start
        if (apiKeyId) {
            await logApiRequest(apiKeyId, 'POST', '/api/v1/orders', status, userId, duration)
        }
    }
}

// 10. HANDLER PARA CORS (OPTIONS)
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
        },
    })
}