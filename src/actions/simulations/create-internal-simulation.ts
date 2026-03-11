'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse } from '@/types/action-response'
import type { SimulationData } from '@/components/forms/new-simulation/validation/new-simulation'
import { calculateSimulation, type SimulationInput } from '@/lib/calculation-engine'
import createOrderFromSimulation from '@/actions/orders/create-order-from-simulation'

interface SimulationContext {
    partnerId: string
    sellerId: string | null
}

// Helper para converter strings numéricas com máscara para número
function parseNumericString(value: string | undefined | null): number {
    if (!value) return 0
    const digitsOnly = value.replace(/\D/g, "")
    return parseInt(digitsOnly, 10) || 0
}

// Helper para formatar data DD/MM/AAAA -> AAAA-MM-DD
function formatDateForDb(dateStr: string): string | null {
    if (!dateStr) return null
    const [day, month, year] = dateStr.split("/")
    return `${year}-${month}-${day}`
}

export default async function createInternalSimulation(
    data: SimulationData,
    context: SimulationContext,
    createOrder: boolean
): Promise<ActionResponse<{ id: string; kdi: number }>> {
    try {
        const supabase = await createClient()

        // 0. Obter usuário logado para created_by
        const {
            data: { user },
            error: authError
        } = await supabase.auth.getUser()
        if (authError || !user) {
            return { success: false, message: "Usuário não autenticado." }
        }

        // 1. Upsert Customer (PF/PJ)
        let customerId: string
        let customerQuery = supabase.from("customers").select("id")

        // Prepara dados base do cliente
        const customerBaseData = {
            type: data.type,
            name: data.type === "pf" ? data.name : null,
            company_name: data.type === "pj" ? data.legalName : null,
            contact_name: data.contactName,
            contact_email: data.contactEmail,
            contact_phone: data.contactPhone.replace(/\D/g, ""),
            city: data.city,
            state: data.state,
            postal_code: data.cep.replace(/\D/g, ""),
            street: data.street,
            number: data.number,
            complement: data.complement,
            neighborhood: data.neighborhood,
            annual_revenue: data.type === "pj" && data.annualRevenue ? parseNumericString(data.annualRevenue) : null,
            incorporation_date: data.type === "pj" && data.incorporationDate ? formatDateForDb(data.incorporationDate) : null,
            partner_id: context.partnerId || null,
            internal_manager: context.sellerId || null,
            created_by_user_id: user.id
        }

        if (data.type === "pf") {
            customerQuery = customerQuery.eq("cpf", data.cpf!.replace(/\D/g, ""))
        } else {
            customerQuery = customerQuery.eq("cnpj", data.cnpj!.replace(/\D/g, ""))
        }

        const { data: existingCustomer } = await customerQuery.single()

        if (existingCustomer) {
            customerId = existingCustomer.id
            const { error: updateError } = await supabase
                .from("customers")
                .update({
                    ...customerBaseData,
                    company_name: customerBaseData.company_name ?? undefined,
                    name: customerBaseData.name ?? undefined,
                    updated_at: new Date().toISOString()
                } as any)
                .eq("id", customerId)

            if (updateError) throw new Error(`Erro ao atualizar cliente: ${updateError.message}`)
        } else {
            const { data: newCustomer, error: insertError } = await supabase
                .from("customers")
                .insert({
                    ...customerBaseData,
                    cpf: data.type === "pf" && data.cpf ? data.cpf.replace(/\D/g, "") : null,
                    // FIX: CNPJ deve ser null se não for PJ, para não violar constraint unique com string vazia
                    cnpj: data.type === "pj" && data.cnpj ? data.cnpj.replace(/\D/g, "") : null,
                } as any)
                .select("id")
                .single()

            if (insertError) throw new Error(`Erro ao criar cliente: ${insertError.message}`)
            customerId = newCustomer.id
        }

        // 2. Calculate Simulation
        const consumptionValue = parseNumericString(data.currentConsumption)
        const systemPowerValue = parseNumericString(data.systemPower)

        const simulationInput: SimulationInput = {
            monthlyConsumption: consumptionValue,
            energyRate: 0.95,
        }
        const calculationResult = calculateSimulation(simulationInput)

        // 3. Create Simulation Record
        const { data: simulation, error: simError } = await supabase
            .from("simulations")
            .insert({
                customer_id: customerId,
                created_by_user_id: user.id,
                seller_id: context.sellerId || user.id,
                current_consumption: consumptionValue,
                energy_provider: data.energyProvider,
                connection_voltage: data.connectionVoltage,
                structure_type: data.structureType,
                status: createOrder ? "won" : "initial_contact",
                result: calculationResult as any,
                system_power: systemPowerValue || calculationResult.systemSize,
                equipment_value: typeof data.equipmentValue === "number" ? data.equipmentValue : parseNumericString(data.equipmentValue as any),
                labor_value: typeof data.laborValue === "number" ? data.laborValue : parseNumericString(data.laborValue as any),
                kit_inverter_id: parseInt(data.kit_inverter, 10) || 0,
                kit_module_id: parseInt(data.kit_module, 10) || 0,
                kit_others: data.kit_others ? parseNumericString(data.kit_others) : null
            })
            .select("id, kdi")
            .single()

        if (simError) throw new Error(`Erro ao salvar simulação: ${simError.message}`)

        // 4. Create Order (if requested)
        if (createOrder && simulation) {
            const orderRes = await createOrderFromSimulation(simulation.id)

            if (!orderRes.success) {
                return { success: false, message: `Simulação criada, mas erro ao gerar pedido: ${orderRes.message}` }
            }

            return {
                success: true,
                message: "Simulação e Pedido criados com sucesso!",
                data: {
                    id: orderRes.data.orderId,
                    kdi: simulation.kdi
                }
            }
        }

        return {
            success: true,
            message: "Simulação criada com sucesso",
            data: {
                id: simulation.id,
                kdi: simulation.kdi
            }
        }
    } catch (error) {
        console.error("Error creating internal simulation:", error)
        return {
            success: false,
            message: error instanceof Error ? error.message : "Erro desconhecido ao processar."
        }
    }
}
