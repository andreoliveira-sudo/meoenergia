"use server"

import { getCurrentUser } from "@/actions/auth"
import { getCurrentPartnerDetails } from "@/actions/partners"
import { getAllSellers } from "@/actions/sellers"
import type { Seller } from "@/lib/definitions/sellers"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Busca vendedores com base na função do usuário logado.
 * - Admin: Vê todos os vendedores.
 * - Seller: Vê apenas os seus próprios dados.
 * - Partner: Vê apenas o vendedor ao qual está atrelado.
 */
async function getSellersForCurrentUser(): Promise<Seller[]> {
	const supabase = createAdminClient()
	const user = await getCurrentUser()

	if (!user || !user.id || !user.role) {
		console.error("Usuário não autenticado ou sem função definida.")
		return []
	}

	try {
		if (user.role === "admin") {
			return await getAllSellers()
		}

		if (user.role === "seller") {
			const { data: seller, error } = await supabase.from("sellers").select("*").eq("user_id", user.id)
			if (error) {
				console.error("Erro ao buscar dados do vendedor logado:", error)
				return []
			}
			return seller || []
		}

		if (user.role === "partner") {
			const partnerDetails = await getCurrentPartnerDetails()
			if (!partnerDetails?.sellerId) {
				// Parceiro não está associado a nenhum vendedor
				return []
			}

			const { data: seller, error } = await supabase.from("sellers").select("*").eq("id", partnerDetails.sellerId)

			if (error) {
				console.error("Erro ao buscar vendedor do parceiro:", error)
				return []
			}
			return seller || []
		}

		// Para qualquer outra role, retorna vazio
		return []
	} catch (error) {
		console.error("Erro inesperado em getSellersForCurrentUser:", error)
		return []
	}
}

export default getSellersForCurrentUser
