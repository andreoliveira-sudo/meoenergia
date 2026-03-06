"use server"

import { PostgrestError } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import type { ActionResponse } from "@/types/action-response"

interface SetPartnerActiveStatusProps {
	partnerId: string
	isActive: boolean
}

async function setPartnerActiveStatus({ partnerId, isActive }: SetPartnerActiveStatusProps): Promise<ActionResponse<{ partnerId: string }>> {
	if (!partnerId) {
		return {
			success: false,
			message: "ID do parceiro não fornecido."
		}
	}

	try {
		const supabase = await createClient()

		// Apenas atualiza o campo is_active
		const { error, count } = await supabase.from("partners").update({ is_active: isActive }, { count: "exact" }).eq("id", partnerId)

		if (error) {
			console.error("Erro ao atualizar status de atividade do parceiro (Supabase):", error)
			return {
				success: false,
				message: "Erro ao atualizar o status de atividade do parceiro. Por favor, tente novamente."
			}
		}

		if (count === 0) {
			return {
				success: false,
				message: "Nenhum parceiro encontrado com o ID fornecido. A atualização falhou."
			}
		}

		revalidatePath("/dashboard/partners")

		const actionMessage = isActive ? "ativado" : "inativado"

		return {
			success: true,
			message: `Parceiro ${actionMessage} com sucesso!`,
			data: {
				partnerId
			}
		}
	} catch (error) {
		console.error("Erro inesperado na action 'setPartnerActiveStatus':", error)

		if (error instanceof PostgrestError) {
			return {
				success: false,
				message: `Ocorreu um problema de comunicação com o sistema. Código: ${error.code}`
			}
		}

		return {
			success: false,
			message: "Ocorreu um erro inesperado. Por favor, contate o suporte."
		}
	}
}

export default setPartnerActiveStatus
