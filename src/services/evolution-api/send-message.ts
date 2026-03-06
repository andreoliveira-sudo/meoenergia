import { ActionResponse } from '@/types/action-response'

interface SendMessageProps {
  phone: string
  message: string
  delay?: number
}

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE

function sanitizePhone(phone: string): string {
  // Remove non-digits
  const digits = phone.replace(/\D/g, '')

  // If it starts with 55, keep it. If not, append 55 (assuming BR numbers for now)
  // Simple heuristic: if length is 10 or 11, prepend 55.
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`
  }

  return digits
}

export async function sendWhatsAppMessage({
  phone,
  message,
  delay = 1000,
}: SendMessageProps): Promise<ActionResponse<any>> {
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE) {
    console.warn('Evolution API credentials missing')
    return { success: false, message: 'Evolution API credentials missing' }
  }

  const sanitizedPhone = sanitizePhone(phone)

  try {
    const url = `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`
    const payload = {
      number: sanitizedPhone,
      text: message,
      linkPreview: false,
      delay: delay,
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: EVOLUTION_API_KEY,
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Evolution API Error:', data)
      return { success: false, message: 'Falha no envio da mensagem' }
    }

    return { success: true, message: 'Mensagem enviada', data }
  } catch (error) {
    console.error('Evolution API Exceção:', error)
    return { success: false, message: 'Erro ao conectar com Evolution API' }
  }
}
