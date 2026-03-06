"use server"

import { PostgrestError } from "@supabase/supabase-js"

import { createUser } from "@/actions/auth"
import { createClient } from "@/lib/supabase/server"
import type { RegisterSellerData } from "@/lib/validations/seller"
import type { ActionResponse } from "@/types/action-response"

const sellerRegistrationErrorMessages: Record<string, string> = {
	"23505": "Este CPF já está cadastrado.", // Específico para a tabela sellers
	userCreationFailed: "Não foi possível criar o usuário. Tente novamente.",
	sellerInsertionFailed: "O usuário foi criado, mas não foi possível registrar os dados do vendedor. A operação foi cancelada.",
	default: "Ocorreu um erro inesperado. Por favor, tente novamente."
}

async function registerSeller(data: RegisterSellerData): Promise<ActionResponse<{ userId: string; sellerId: string }>> {
	const supabase = await createClient()
	let newAuthUserId: string | null = null

	try {
		// 1. Verificar se o CPF já existe na tabela 'sellers'
		const { data: existingSeller, error: cpfError } = await supabase.from("sellers").select("user_id").eq("cpf", data.cpf).maybeSingle()

		if (cpfError) throw cpfError
		if (existingSeller) {
			return { success: false, message: sellerRegistrationErrorMessages["23505"] }
		}

		// 2. Chamar a action centralizada para criar o usuário em auth.users e public.users
		const userResponse = await createUser({
			email: data.email,
			password: data.password,
			role: "seller",
			name: data.name
		})

		if (!userResponse.success) {
			// Propaga a mensagem de erro específica da action createUser (ex: email já existe, senha fraca)
			return { success: false, message: userResponse.message }
		}

		newAuthUserId = userResponse.data.id

		// 3. Tentar inserir os dados específicos do vendedor na tabela 'sellers'
		const { data: sellerData, error: sellerError } = await supabase
			.from("sellers")
			.insert({
				user_id: newAuthUserId,
				name: data.name,
				cpf: data.cpf,
				email: data.email,
				phone: data.phone,
				cep: data.cep,
				street: data.street,
				number: data.number,
				complement: data.complement,
				neighborhood: data.neighborhood,
				city: data.city,
				state: data.state
			})
			.select("user_id")
			.single()

		if (sellerError) {
			// Se esta inserção falhar, a ação de compensação (deletar usuário) será acionada no bloco catch
			throw sellerError
		}

		return {
			success: true,
			message: "Vendedor cadastrado com sucesso!",
			data: {
				userId: newAuthUserId,
				sellerId: sellerData.user_id
			}
		}
	} catch (error) {
		console.error("Erro no processo de registro de vendedor:", error)

		// Ação de compensação
		if (newAuthUserId) {
			await supabase.auth.admin.deleteUser(newAuthUserId)
		}

		if (error instanceof PostgrestError) {
			const errorCode = error.code || "default"
			const message = sellerRegistrationErrorMessages[errorCode] || sellerRegistrationErrorMessages.default
			return { success: false, message }
		}

		return {
			success: false,
			message: sellerRegistrationErrorMessages.default
		}
	}
}

export default registerSeller
