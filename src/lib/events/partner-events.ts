import { createClient } from '@/lib/supabase/server'
import { sendWhatsAppMessage } from '@/services/evolution-api/send-message'

const PARTNER_APPROVED_TRIGGER = 'PARTNER_APPROVED'

export async function handlePartnerApproved(partnerId: string) {
    const supabase = await createClient()

    // 1. Buscar o Template Ativo
    const { data: template, error: templateError } = await supabase
        // @ts-ignore
        .from('notification_templates')
        .select('*')
        .eq('trigger_key', PARTNER_APPROVED_TRIGGER)
        .eq('active', true)
        .single()

    if (templateError || !template) {
        console.log(`[Notification] Template não encontrado ou inativo para trigger: ${PARTNER_APPROVED_TRIGGER}`)
        return
    }

    // @ts-ignore
    const msgText = template.whatsapp_text || template.content

    if (!msgText) {
        console.log(`[Notification] Template sem texto de WhatsApp configurado: ${PARTNER_APPROVED_TRIGGER}`)
        return
    }

    // 2. Buscar dados do Parceiro
    const { data: partner, error: partnerError } = await supabase
        .from('partners')
        .select('*')
        .eq('id', partnerId)
        .single()

    if (partnerError || !partner) {
        console.error(`[Notification] Erro ao buscar dados do parceiro: ${partnerId}`, partnerError)
        return
    }

    const contactName = partner.contact_name || 'Parceiro'
    // Sanitização básica do telefone (Evolution API já faz, mas garantimos aqui se necessário)
    const contactMobile = partner.contact_mobile

    if (!contactMobile) {
        console.warn(`[Notification] Parceiro sem celular cadastrado. ID: ${partnerId}`)
        return
    }

    // 3. Substituir Variáveis
    // Ex: "Olá {{name}}, sua parceria foi aprovada!"
    let message = msgText
        .replace(/{{name}}/g, contactName)

    // 4. Enviar Mensagem
    console.log(`[Notification] Enviando WhatsApp de Aprovação para ${contactMobile}`)

    await sendWhatsAppMessage({
        phone: contactMobile,
        message: message
    })
}
