"use server"

import { getCurrentUser } from "@/actions/auth"
import { getSellerByUserId } from "@/actions/sellers"
import type { PartnerWithSellerName } from "@/lib/definitions/partners"
import { createAdminClient } from "@/lib/supabase/admin"
import { getAllPartners } from "."

/**
 * Busca parceiros com base na função do usuário logado.
 * - Admin: Vê todos os parceiros.
 * - Seller: Vê apenas os parceiros associados a ele.
 * - Partner: Vê uma lista vazia.
 */
async function getPartnersForCurrentUser(): Promise<PartnerWithSellerName[]> {
	const supabase = createAdminClient()
	const user = await getCurrentUser()

	if (!user || !user.id || !user.role) {
		console.error("Usuário não autenticado ou sem função definida.")
		return []
	}

	try {
		if (user.role === "admin") {
			// Admin vê todos os parceiros
			return await getAllPartners()
		}

		if (user.role === "seller") {
			// Seller vê apenas seus parceiros associados
			const sellerResponse = await getSellerByUserId(user.id)
			if (!sellerResponse.success || !sellerResponse.data) {
				console.error("Vendedor não encontrado para o usuário atual.")
				return []
			}
			const sellerId = sellerResponse.data.id

			const { data: partners, error } = await supabase.from("partners").select("*, sellers(name)").eq("seller_id", sellerId)

			if (error) {
				console.error("Erro ao buscar parceiros do vendedor:", error)
				return []
			}
			return (
				partners?.map((partner) => ({
					...partner,
					seller_name: partner.sellers?.name || null
				})) || []
			)
		}

		// Partner (e qualquer outra role) não vê nenhum parceiro
		return []
	} catch (error) {
		console.error("Erro inesperado em getPartnersForCurrentUser:", error)
		return []
	}
}

export default getPartnersForCurrentUser
