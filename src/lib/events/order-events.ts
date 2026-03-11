import { createClient } from '@/lib/supabase/server'
import { sendWhatsAppMessage } from '@/services/evolution-api/send-message'

// Mapa de status para Trigger Key do banco de dados
const STATUS_TRIGGER_MAP: Record<string, string> = {
    // Análise
    analysis_pending: "ORDER_ANALYSIS_PENDING",
    analysis_approved: "ORDER_ANALYSIS_APPROVED",
    analysis_rejected: "ORDER_ANALYSIS_REJECTED",

    // Documentação
    documents_pending: "DOCUMENTS_PENDING",
    docs_analysis: "ORDER_DOCS_ANALYSIS",

    // Execução
    sending_distributor_invoice: "ORDER_SENDING_DISTRIBUTOR_INVOICE",
    payment_distributor: "ORDER_PAYMENT_DISTRIBUTOR",
    access_opinion: "ORDER_ACCESS_OPINION",
    initial_payment_integrator: "ORDER_INITIAL_PAYMENT_INTEGRATOR",
    final_payment_integrator: "ORDER_FINAL_PAYMENT_INTEGRATOR",

    // Finalização
    finished: "ORDER_FINISHED",
    canceled: "ORDER_CANCELED",
}

export async function handleOrderStatusChange(orderId: string, newStatus: string, authorId?: string) {
    const triggerKey = STATUS_TRIGGER_MAP[newStatus]

    if (!triggerKey) {
        console.log(`[Notification] Sem trigger configurado para status: ${newStatus}`)
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
    // @ts-ignore
    const internalText = template.content || template.whatsapp_text

    if (!msgText) {
        console.log(`[Notification] Template sem texto configurado: ${triggerKey}`)
        return
    }

    // 2. Buscar dados do Pedido e Cliente
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
            id,
            customer_id,
            created_by_user_id,
            customers(
                contact_name,
                contact_phone,
                company_name
            )
        `)
        .eq('id', orderId)
        .single()

    // @ts-ignore
    if (orderError || !order || !order.customers) {
        console.error(`[Notification] Erro ao buscar dados do pedido / cliente: ${orderId}`, orderError)
        return
    }

    // @ts-ignore
    const customerName = order.customers.contact_name || 'Cliente'
    // @ts-ignore
    const customerPhone = order.customers.contact_phone
    // @ts-ignore
    const integratorId = order.created_by_user_id

    // Dados Extras para Status APROVADO
    let approvedVariables: Record<string, string> = {}
    if (newStatus === 'analysis_approved') {
        // Como 'payment_value' e 'term' não existem na tabela simulations atualmente,
        // vamos usar valores de placeholder ou buscar de onde for possível.
        // O customer_name pode vir de order.customers.company_name

        // CORREÇÃO: Usar dados já carregados do cliente, pois não existem na tabela simulations
        const companyName = order.customers.company_name
        const contactName = order.customers.contact_name

        // Definir variáveis com fallback
        approvedVariables = {
            '{{customer_name}}': companyName || contactName || 'Cliente',
            '{{mensalidade}}': 'Consultar Contrato', // Placeholder até que o campo exista no BD
            '{{prazo}}': 'Consultar Contrato',      // Placeholder até que o campo exista no BD
        }
    }

    // 3. Preparar Promises (Híbrido)
    const promises = []

    // Função auxiliar para logar
    const logNotification = async (channel: 'whatsapp' | 'internal', content: string, status: 'sent' | 'failed', error?: string) => {
        try {
            // @ts-ignore
            await supabase.from('notification_logs').insert({
                recipient_name: customerName,
                recipient_phone: customerPhone,
                channel,
                content,
                triggered_by_user_id: authorId, // Pode ser null se for automático
                order_id: orderId,
                status,
                error_message: error
            })
        } catch (err) {
            console.error('[Notification] Falha ao salvar log:', err)
        }
    }

    // A. Notificação Interna (Se houver integrador vinculado)
    if (integratorId) {
        const shortId = orderId.split('-')[0]
        const internalTitle = `Pedido ${newStatus.toUpperCase()}`
        const finalInternalContent = (internalText || msgText)
            .replace(/{{name}}/g, customerName)
            .replace(/{{order_id}}/g, shortId)

        const internalPromise = supabase
            .from('notifications')
            .insert({
                user_id: integratorId,
                title: template.name || internalTitle,
                content: finalInternalContent,
                link: `/dashboard/orders?id=${orderId}`,
                read: false
            })
            .then(async ({ error }) => {
                if (error) {
                    await logNotification('internal', finalInternalContent, 'failed', error.message)
                    throw new Error(`Erro BD: ${error.message}`)
                }
                await logNotification('internal', finalInternalContent, 'sent')
                return "Notificação Interna OK"
            })

        promises.push(internalPromise)
    } else {
        console.warn(`[Notification] Pedido ${orderId} sem 'created_by_user_id'. Notificação interna pulada.`)
    }

    // B. Notificação WhatsApp (Se tiver telefone e template ativo)
    if (customerPhone && template.active) {
        // Substituir Variáveis para WhatsApp
        let whatsappMessage = msgText
            .replace(/{{name}}/g, customerName)
            .replace(/{{order_id}}/g, orderId.split('-')[0])

        // Aplicar variáveis extras de aprovação
        if (newStatus === 'approved' && Object.keys(approvedVariables).length > 0) {
            for (const [key, value] of Object.entries(approvedVariables)) {
                // Criar regex global para substituir todas as ocorrências
                // Escapar caracteres especiais da chave (como {{ e }})
                const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                whatsappMessage = whatsappMessage.replace(new RegExp(escapedKey, 'g'), value);
            }
        }

        console.log(`[Notification] Enviando WhatsApp para ${customerPhone}: ${triggerKey}`)
        const whatsPromise = sendWhatsAppMessage({
            phone: customerPhone,
            message: whatsappMessage
        }).then(async (res) => {
            if (!res.success) {
                await logNotification('whatsapp', whatsappMessage, 'failed', res.message)
                throw new Error(`Erro Evolution: ${res.message}`)
            }
            await logNotification('whatsapp', whatsappMessage, 'sent')
            return "WhatsApp OK"
        })

        promises.push(whatsPromise)
    } else if (!customerPhone) {
        console.warn(`[Notification] Cliente sem telefone cadastrado. WhatsApp pulado. Pedido: ${orderId}`)
    } else {
        console.log(`[Notification] Template inativo para WhatsApp: ${triggerKey}. Apenas interno (se houve).`)
    }

    // 4. Executar em Paralelo (AllSettled)
    if (promises.length > 0) {
        const results = await Promise.allSettled(promises)
        results.forEach((res, index) => {
            if (res.status === 'rejected') {
                console.error(`[Notification] Falha na tarefa ${index}:`, res.reason)
            } else {
                console.log(`[Notification] Sucesso na tarefa ${index}:`, res.value)
            }
        })
    }
}
