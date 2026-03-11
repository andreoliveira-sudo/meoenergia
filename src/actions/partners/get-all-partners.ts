"use server"

import type { PartnerWithSellerName } from "@/lib/definitions/partners"
import { createAdminClient } from "@/lib/supabase/admin"

async function getAllPartners(): Promise<PartnerWithSellerName[]> {
	try {
		const supabase = createAdminClient()

		const { data: partners, error } = await supabase.from("partners").select("*, sellers(name)").is("deleted_at", null)

		if (error) {
			console.error("Erro na consulta:", error)
			throw new Error("Erro ao buscar parceiro no banco de dados")
		}

		return (
			partners?.map((partner) => ({
				...partner,
				seller_name: partner.sellers?.name || null
			})) || []
		)
	} catch (error) {
		console.error("Erro ao buscar parceiro:", error)
		return []
	}
}

export default getAllPartners
