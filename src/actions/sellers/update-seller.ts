"use server"

import { PostgrestError } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import type { EditSellerData } from "@/lib/validations/seller"
import type { ActionResponse } from "@/types/action-response"

async function updateSeller(sellerId: string, data: EditSellerData): Promise<ActionResponse<{ sellerId: string }>> {
	if (!sellerId) {
		return {
			success: false,
			message: "ID do vendedor não fornecido."
		}
	}

	const supabase = await createClient()
	let originalSellerData: EditSellerData | null = null
	let userIdToUpdate: string | null = null

	try {
		// 1. Obter os dados originais e o user_id para poder reverter em caso de falha
		const { data: currentSeller, error: fetchError } = await supabase
			.from("sellers")
			.select("name, cpf, phone, cep, street, number, complement, neighborhood, city, state, user_id")
			.eq("id", sellerId)
			.single()

		if (fetchError || !currentSeller) {
			console.error("Erro ao buscar vendedor original:", fetchError)
			return { success: false, message: "Não foi possível encontrar o vendedor para atualização." }
		}

		// Armazena os dados para reversão e o user_id para a segunda atualização
		originalSellerData = {
			...currentSeller,
			complement: currentSeller.complement ?? undefined
		}
		userIdToUpdate = currentSeller.user_id

		// 2. Tentar atualizar a tabela de vendedores
		const { error: sellerError } = await supabase.from("sellers").update(data).eq("id", sellerId)

		if (sellerError) {
			console.error("Erro ao atualizar vendedor (Supabase):", sellerError)
			if (sellerError.code === "23505" && sellerError.message.includes("sellers_cpf_key")) {
				return {
					success: false,
					message: "O CPF fornecido já está em uso por outro vendedor."
				}
			}
			throw sellerError
		}

		// 3. Tentar atualizar o nome na tabela de usuários usando o user_id
		if (!userIdToUpdate) {
			// Se por algum motivo o user_id não foi encontrado, lançamos um erro para reverter.
			throw new Error("ID do usuário associado não encontrado. A atualização foi cancelada.")
		}

		const { error: userError } = await supabase.from("users").update({ name: data.name }).eq("id", userIdToUpdate)

		if (userError) {
			console.error("Erro ao atualizar nome na tabela de usuários (Supabase):", userError)
			// Se a atualização do usuário falhar, reverta a atualização do vendedor
			const { error: revertError } = await supabase.from("sellers").update(originalSellerData).eq("id", sellerId)

			if (revertError) {
				console.error("FALHA CRÍTICA: Erro ao reverter atualização do vendedor:", revertError)
				return {
					success: false,
					message: "Ocorreu um erro crítico ao atualizar os dados e a reversão automática falhou. Por favor, contate o suporte imediatamente."
				}
			}

			return {
				success: false,
				message: "A atualização do vendedor falhou porque não foi possível sincronizar o nome de usuário. Nenhuma alteração foi salva."
			}
		}

		revalidatePath("/dashboard/sellers")

		return {
			success: true,
			message: "Vendedor atualizado com sucesso!",
			data: {
				sellerId
			}
		}
	} catch (error) {
		console.error("Erro inesperado na action 'updateSeller':", error)

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

export default updateSeller
