"use server"

import type { Partner } from "@/lib/definitions/partners"
import { createClient } from "@/lib/supabase/server"

// A interface foi ajustada para corresponder à estrutura de dados esperada
export interface PartnerWithSeller extends Partner {
	seller_name: string
}

/**
 * Busca todos os parceiros ativos e aprovados com informações do seller.
 * Para uso pelo admin na seleção de contexto da simulação.
 */
async function getAllPartnersWithSeller(): Promise<PartnerWithSeller[]> {
	try {
		const supabase = await createClient()

		const { data: partners, error } = await supabase
			.from("partners")
			.select(
				`
        *,
        sellers (
          name
        )
      `
			)
			.eq("status", "approved")
			.eq("is_active", true)
			.order("legal_business_name")

		if (error) {
			console.error("Erro ao buscar parceiros com vendedor:", error)
			return []
		}

		// Transforma o resultado para incluir o nome do seller diretamente
		const result: PartnerWithSeller[] =
			partners
				?.map((partner) => {
					// sellers pode ser null ou um objeto com a propriedade name
					if (!partner.sellers) {
						return null
					}

					// Desestrutura para remover a propriedade 'sellers' e evitar o erro de tipo
					const { sellers, ...restOfPartner } = partner

					return {
						...restOfPartner,
						seller_name: sellers.name
					}
				})
				.filter((p): p is PartnerWithSeller => p !== null) || []

		return result
	} catch (error) {
		console.error("Erro inesperado em getAllPartnersWithSeller:", error)
		return []
	}
}

export default getAllPartnersWithSeller
