"use server"

import { PostgrestError } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import type { ActionResponse } from "@/types/action-response"

interface SetSellerActiveStatusProps {
	sellerId: string
	isActive: boolean
}

async function setSellerActiveStatus({ sellerId, isActive }: SetSellerActiveStatusProps): Promise<ActionResponse<{ sellerId: string }>> {
	if (!sellerId) {
		return {
			success: false,
			message: "ID do vendedor não fornecido."
		}
	}

	try {
		const supabase = await createClient()

		// Apenas atualiza o campo is_active
		const { error, count } = await supabase.from("sellers").update({ is_active: isActive }, { count: "exact" }).eq("id", sellerId)

		if (error) {
			console.error("Erro ao atualizar status de atividade do vendedor (Supabase):", error)
			return {
				success: false,
				message: "Erro ao atualizar o status de atividade do vendedor. Por favor, tente novamente."
			}
		}

		if (count === 0) {
			return {
				success: false,
				message: "Nenhum vendedor encontrado com o ID fornecido. A atualização falhou."
			}
		}

		revalidatePath("/dashboard/sellers")

		const actionMessage = isActive ? "ativado" : "inativado"

		return {
			success: true,
			message: `Vendedor ${actionMessage} com sucesso!`,
			data: {
				sellerId
			}
		}
	} catch (error) {
		console.error("Erro inesperado na action 'setSellerActiveStatus':", error)

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

export default setSellerActiveStatus
