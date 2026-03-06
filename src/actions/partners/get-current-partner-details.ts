"use server"

import { createClient } from "@/lib/supabase/server"

interface PartnerDetails {
	status: "approved" | "pending" | "rejected" | null
	isActive: boolean | null
	sellerId: string | null
}

/**
 * Busca os detalhes essenciais (status, atividade e seller_id) do parceiro logado.
 * @returns Um objeto com os detalhes do parceiro ou null se não for um parceiro.
 */
async function getCurrentPartnerDetails(): Promise<PartnerDetails | null> {
	const supabase = await createClient()

	const {
		data: { user }
	} = await supabase.auth.getUser()

	if (!user) {
		return null
	}

	try {
		const { data: partner, error } = await supabase.from("partners").select("status, is_active, seller_id").eq("user_id", user.id).single()

		if (error || !partner) {
			// Isso é esperado se o usuário logado não for um parceiro.
			return null
		}

		return {
			status: partner.status,
			isActive: partner.is_active,
			sellerId: partner.seller_id
		}
	} catch (e) {
		console.error("Erro inesperado em getCurrentPartnerDetails:", e)
		return null
	}
}

export default getCurrentPartnerDetails
