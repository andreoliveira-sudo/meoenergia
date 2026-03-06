"use server"

import { PostgrestError } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import type { ActionResponse } from "@/types/action-response"

async function approveSeller(sellerId: string): Promise<ActionResponse<{ sellerId: string }>> {
	if (!sellerId) {
		return {
			success: false,
			message: "ID do vendedor não fornecido."
		}
	}

	try {
		const supabase = await createClient()

		const { error, count } = await supabase.from("sellers").update({ status: "approved", is_active: true }, { count: "exact" }).eq("id", sellerId)

		if (error) {
			console.error("Erro ao aprovar vendedor (Supabase):", error)
			return {
				success: false,
				message: "Erro ao atualizar o status do vendedor. Por favor, tente novamente."
			}
		}

		if (count === 0 || count === null) {
			return {
				success: false,
				message: "Nenhum vendedor encontrado com o ID fornecido. A aprovação falhou."
			}
		}

		revalidatePath("/dashboard/sellers")

		return {
			success: true,
			message: "Vendedor aprovado com sucesso!",
			data: {
				sellerId
			}
		}
	} catch (error) {
		console.error("Erro inesperado na action 'approveSeller':", error)

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

export default approveSeller
