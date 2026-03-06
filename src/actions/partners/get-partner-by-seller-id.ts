"use server"

import type { Partner } from "@/lib/definitions/partners"
import { createClient } from "@/lib/supabase/server"

/**
 * Busca todos os parceiros ativos e aprovados associados a um ID de vendedor específico.
 * @param sellerId O ID do vendedor.
 * @returns Uma Promise que resolve para um array de parceiros ou um array vazio.
 */
async function getPartnersBySellerId(sellerId: string): Promise<Partner[]> {
	if (!sellerId) {
		return []
	}

	try {
		const supabase = await createClient()

		const { data: partners, error } = await supabase
			.from("partners")
			.select("*")
			.eq("seller_id", sellerId)
			.eq("status", "approved")
			.eq("is_active", true)
			.order("legal_business_name")

		if (error) {
			console.error("Erro ao buscar parceiros por vendedor:", error)
			return []
		}

		return partners || []
	} catch (error) {
		console.error("Erro inesperado em getPartnersBySellerId:", error)
		return []
	}
}

export default getPartnersBySellerId
