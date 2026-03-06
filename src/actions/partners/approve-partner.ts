"use server"

import { PostgrestError } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/server"
import type { ActionResponse } from "@/types/action-response"

interface ApprovePartnerProps {
	partnerId: string
	sellerId: string
}

async function approvePartner({ partnerId, sellerId }: ApprovePartnerProps): Promise<ActionResponse<ApprovePartnerProps>> {
	if (!partnerId) {
		return {
			success: false,
			message: "ID do parceiro não fornecido."
		}
	}

	if (!sellerId) {
		return {
			success: false,
			message: "ID do vendedor não fornecido."
		}
	}

	try {
		const supabase = await createClient()

		const { error, count } = await supabase
			.from("partners")
			.update({ status: "approved", is_active: true, seller_id: sellerId }, { count: "exact" })
			.eq("id", partnerId)

		if (error) {
			console.error("Erro ao aprovar parceiro (Supabase):", error)
			return {
				success: false,
				message: `Erro ao atualizar o status do parceiro. Por favor, tente novamente.`
			}
		}

		if (count === 0 || count === null) {
			return {
				success: false,
				message: "Nenhum parceiro encontrado com o ID fornecido. A aprovação falhou. Contate o Suporte"
			}
		}

		// Disparar notificação (Fire and forget)
		// @ts-ignore - Import dinâmico ou ignore se TS reclamar de módulo novo
		const { handlePartnerApproved } = await import('@/lib/events/partner-events')
		handlePartnerApproved(partnerId).catch(err => console.error("Erro ao enviar notificação de parceiro:", err))

		return {
			success: true,
			message: "Parceiro aprovado com sucesso!",
			data: {
				partnerId,
				sellerId
			}
		}
	} catch (error) {
		console.error("Erro inesperado na action 'approvePartner':", error)

		// Verifica se o erro é uma instância de PostgrestError para dar uma mensagem mais específica
		if (error instanceof PostgrestError) {
			console.error(`Ocorreu um problema de comunicação com o sistema. Código: ${error.code}`)

			return {
				success: false,
				message: `Ocorreu um problema de comunicação com o sistema. Código: ${error.code}`
			}
		}

		// Fallback para outros tipos de erro (ex: rede)
		return {
			success: false,
			message: "Ocorreu um erro inesperado. Por favor, contate o suporte."
		}
	}
}

export default approvePartner
