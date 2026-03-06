"use server"

import { createClient } from "@/lib/supabase/server"
import type { EditPartnerData } from "@/lib/validations/partner"
import type { ActionResponse } from "@/types/action-response"

async function updatePartner(partnerId: string, data: EditPartnerData): Promise<ActionResponse<{ partnerId: string }>> {
	if (!partnerId) {
		return {
			success: false,
			message: "ID do parceiro não fornecido."
		}
	}

	const supabase = await createClient()
	let originalPartnerData: EditPartnerData | null = null
	let userIdToUpdate: string | null = null

	try {
		// 1. Obter os dados originais e o user_id para poder reverter em caso de falha
		const { data: currentPartner, error: fetchError } = await supabase
			.from("partners")
			.select("contact_name, contact_mobile, cep, street, number, complement, neighborhood, city, state, user_id")
			.eq("id", partnerId)
			.single()

		if (fetchError || !currentPartner) {
			console.error("Erro ao buscar parceiro original:", fetchError)
			return { success: false, message: "Não foi possível encontrar o parceiro para atualização." }
		}

		// Armazena os dados para reversão e o user_id para a segunda atualização
		originalPartnerData = {
			...currentPartner,
			complement: currentPartner.complement ?? undefined
		}
		userIdToUpdate = currentPartner.user_id

		// 2. Tentar atualizar a tabela de parceiros
		const { error: partnerError } = await supabase.from("partners").update(data).eq("id", partnerId)

		if (partnerError) {
			console.error("Erro ao atualizar parceiro (Supabase):", partnerError)
			if (partnerError.code === "23505") {
				return {
					success: false,
					message: "Os dados fornecidos (ex: CNPJ) já estão em uso por outro parceiro."
				}
			}
			throw partnerError
		}

		// 3. Tentar atualizar o nome na tabela de usuários usando o user_id
		if (!userIdToUpdate) {
			throw new Error("ID do usuário associado não encontrado. A atualização foi cancelada.")
		}

		const { error: userError } = await supabase.from("users").update({ name: data.contact_name }).eq("id", userIdToUpdate)

		if (userError) {
			console.error("Erro ao atualizar nome na tabela de usuários (Supabase):", userError)
			// Se a atualização do usuário falhar, reverta a atualização do parceiro
			const { error: revertError } = await supabase.from("partners").update(originalPartnerData).eq("id", partnerId)

			if (revertError) {
				console.error("FALHA CRÍTICA: Erro ao reverter atualização do parceiro:", revertError)
				return {
					success: false,
					message: "Ocorreu um erro crítico ao atualizar os dados e a reversão automática falhou. Por favor, contate o suporte imediatamente."
				}
			}

			return {
				success: false,
				message: "A atualização do parceiro falhou porque não foi possível sincronizar o nome de usuário. Nenhuma alteração foi salva."
			}
		}

		// Se ambas as atualizações funcionaram
		return {
			success: true,
			message: "Parceiro atualizado com sucesso!",
			data: {
				partnerId
			}
		}
	} catch (error) {
		console.error("Erro inesperado na action 'updatePartner':", error)

		// Fallback para outros tipos de erro
		return {
			success: false,
			message: "Ocorreu um erro inesperado. Por favor, contate o suporte."
		}
	}
}

export default updatePartner
