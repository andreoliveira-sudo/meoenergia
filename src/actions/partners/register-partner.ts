"use server"

import { PostgrestError } from "@supabase/supabase-js"

import { createUser } from "@/actions/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import type { RegisterPartnerData } from "@/lib/validations/partner"
import type { ActionResponse } from "@/types/action-response"

const partnerRegistrationErrorMessages: Record<string, string> = {
	"23505": "Este CNPJ já está cadastrado.", // Específico para a tabela partners
	userCreationFailed: "Não foi possível criar o usuário. Tente novamente.",
	partnerInsertionFailed: "O usuário foi criado, mas não foi possível registrar os dados do parceiro. A operação foi cancelada.",
	default: "Ocorreu um erro inesperado. Por favor, tente novamente."
}

async function registerPartner(data: RegisterPartnerData): Promise<ActionResponse<{ partnerId: string }>> {
	const supabase = createAdminClient()
	let newAuthUserId: string | null = null

	try {
		// 1. Verificar se o CNPJ já existe na tabela 'partners' (lógica específica do parceiro)
		const { data: existingPartner, error: cnpjError } = await supabase.from("partners").select("user_id").eq("cnpj", data.cnpj).maybeSingle()

		if (cnpjError) throw cnpjError
		if (existingPartner) {
			return { success: false, message: partnerRegistrationErrorMessages["23505"] }
		}

		// 2. Chamar a action centralizada para criar o usuário em auth.users e public.users
		const userResponse = await createUser({
			email: data.contactEmail,
			password: data.password,
			role: "partner",
			name: data.contactName
		})

		if (!userResponse.success || !userResponse.data?.id) {
			// Propaga a mensagem de erro específica da action createUser (ex: email já existe)
			return { success: false, message: userResponse.message || "Erro ao criar usuário" }
		}

		newAuthUserId = userResponse.data.id

		// 3. Tentar inserir os dados específicos do parceiro na tabela 'partners'
		const { data: partnerData, error: partnerError } = await supabase
			.from("partners")
			.insert({
				user_id: newAuthUserId,
				cnpj: data.cnpj,
				legal_business_name: data.legalBusinessName,
				contact_name: data.contactName,
				contact_email: data.contactEmail,
				contact_mobile: data.contactMobile,
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

		if (partnerError) {
			// Se esta inserção falhar, a ação de compensação (deletar usuário) será acionada no bloco catch
			throw partnerError
		}

		return {
			success: true,
			message: "Parceiro cadastrado com sucesso! Seu cadastro está em análise.",
			data: {
				partnerId: partnerData.user_id
			}
		}
	} catch (error) {
		console.error("Erro no processo de registro de parceiro:", error)

		// Ação de compensação: se o usuário de autenticação foi criado, mas algo deu errado depois,
		// deletamos o usuário de autenticação para manter a consistência.
		// A trigger ON DELETE CASCADE cuidará de remover da public.users
		if (newAuthUserId) {
			await supabase.auth.admin.deleteUser(newAuthUserId)
		}

		if (error instanceof PostgrestError) {
			const errorCode = error.code || "default"
			const message = partnerRegistrationErrorMessages[errorCode] || partnerRegistrationErrorMessages.default
			return { success: false, message }
		}

		return {
			success: false,
			message: partnerRegistrationErrorMessages.default
		}
	}
}

export default registerPartner
