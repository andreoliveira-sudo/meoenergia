import { createClient } from '@/lib/supabase/server'
import { sendWhatsAppMessage } from '@/services/evolution-api/send-message'

// Mapa de status para Trigger Key do banco de dados
const STATUS_TRIGGER_MAP: Record<string, string> = {
    initial_contact: 'SIMULATION_INITIAL_CONTACT',
    under_review: 'SIMULATION_UNDER_REVIEW',
    in_negotiation: 'SIMULATION_IN_NEGOTIATION',
    won: 'SIMULATION_WON',
    lost: 'SIMULATION_LOST',
}

export async function handleSimulationStatusChange(simulationId: string, newStatus: string) {
    const triggerKey = STATUS_TRIGGER_MAP[newStatus]

    if (!triggerKey) {
        console.log(`[Notification] Sem trigger configurado para status de simulação: ${newStatus}`)
        return
    }

    const supabase = await createClient()

    // 1. Buscar o Template Ativo
    const { data: template, error: templateError } = await supabase
        // @ts-ignore
        .from('notification_templates')
        .select('*')
        .eq('trigger_key', triggerKey)
        .eq('active', true)
        .single()

    if (templateError || !template) {
        console.log(`[Notification] Template não encontrado ou inativo para trigger: ${triggerKey}`)
        return
    }

    // @ts-ignore
    const msgText = template.whatsapp_text || template.content

    if (!msgText) {
        console.log(`[Notification] Template sem texto de WhatsApp configurado: ${triggerKey}`)
        return
    }

    // 2. Buscar dados da Simulação e Cliente
    const { data: simulation, error: simulationError } = await supabase
        .from('simulations')
        .select(`
            id,
            total_value,
            customers (
                contact_name,
                contact_phone
            )
        `)
        .eq('id', simulationId)
        .single()

    // @ts-ignore
    if (simulationError || !simulation || !simulation.customers) {
        console.error(`[Notification] Erro ao buscar dados da simulação/cliente: ${simulationId}`, simulationError)
        return
    }

    // @ts-ignore
    const customerName = simulation.customers.contact_name || 'Cliente'
    // @ts-ignore
    const customerPhone = simulation.customers.contact_phone

    if (!customerPhone) {
        console.warn(`[Notification] Cliente sem telefone cadastrado. Simulação: ${simulationId}`)
        return
    }

    // 3. Substituir Variáveis
    let message = msgText
        .replace(/{{name}}/g, customerName)
        .replace(/{{simulation_id}}/g, simulationId.split('-')[0])
        // @ts-ignore
        .replace(/{{total_value}}/g, simulation.total_value ? `R$ ${simulation.total_value}` : '')

    // 4. Enviar Mensagem
    console.log(`[Notification] Enviando WhatsApp para ${customerPhone}: ${triggerKey}`)
    await sendWhatsAppMessage({
        phone: customerPhone,
        message: message
    })
}
