"use server"

import { getCurrentUser } from "@/actions/auth"
import { getSellerByUserId } from "@/actions/sellers"
import type { CustomerWithRelations } from "@/lib/definitions/customers"
import { createAdminClient } from "@/lib/supabase/admin"
import { getPartnerByUserId } from "../partners"
import { getAllCustomers } from "."

/**
 * Busca parceiros com base na função do usuário logado.
 * - Admin: Vê todos os clientes.
 * - Seller: Vê apenas os clientes associados a ele.
 * - Partner: Vê apenas os clientes associados a ele.
 */
async function getCustomersForCurrentUser(): Promise<CustomerWithRelations[]> {
	const supabase = createAdminClient()
	const user = await getCurrentUser()

	if (!user || !user.id || !user.role) {
		console.error("Usuário não autenticado ou sem função definida.")
		return []
	}

	try {
		if (user.role === "admin") {
			// Admin vê todos os parceiros
			return await getAllCustomers()
		}

		if (user.role === "seller") {
			// Seller vê apenas seus parceiros associados
			const sellerResponse = await getSellerByUserId(user.id)
			if (!sellerResponse.success || !sellerResponse.data) {
				console.error("Vendedor não encontrado para o usuário atual.")
				return []
			}
			const sellerId = sellerResponse.data.id

			const { data, error } = await supabase
				.from("customers")
				.select(
					`
        id,
        kdi,
        type,
        company_name,
        name,
        cnpj,
        cpf,
				city,
				state,
				created_at,
        partners (
          contact_name
        ),
        sellers (
            name
        )
      `
				)
				.is("deleted_at", null)
				.order("kdi", { ascending: false })
				.eq("internal_manager", sellerId)

			if (error) {
				console.error("Erro ao buscar clientes com detalhes:", error)
				return []
			}

			const mappedData = data.map((customer) => {
				const partner = Array.isArray(customer.partners) ? customer.partners[0] : customer.partners
				const seller = Array.isArray(customer.sellers) ? customer.sellers[0] : customer.sellers
				const isPf = customer.type === "pf"

				return {
					id: customer.id,
					kdi: customer.kdi,
					type: customer.type,
					company_name: isPf ? (customer.name || "") : (customer.company_name || ""),
					cnpj: isPf ? (customer.cpf || "") : (customer.cnpj || ""),
					partner_name: partner?.contact_name || "N/A",
					internal_manager_name: seller?.name || "N/A",
					city: customer.city,
					state: customer.state,
					created_at: customer.created_at
				}
			})

			return mappedData
		}

		if (user.role === "partner") {
			// Partner vê apenas seus parceiros associados
			const partnerResponse = await getPartnerByUserId(user.id)
			if (!partnerResponse.success || !partnerResponse.data) {
				console.error("Parceiro não encontrado para o usuário atual.")
				return []
			}
			const partnerId = partnerResponse.data.id

			const { data, error } = await supabase
				.from("customers")
				.select(
					`
        id,
        kdi,
        type,
        company_name,
        name,
        cnpj,
        cpf,
				city,
				state,
				created_at,
        partners (
          contact_name
        ),
        sellers (
            name
        )
      `
				)
				.is("deleted_at", null)
				.order("kdi", { ascending: false })
				.eq("partner_id", partnerId)

			if (error) {
				console.error("Erro ao buscar clientes com detalhes:", error)
				return []
			}

			const mappedData = data.map((customer) => {
				const partner = Array.isArray(customer.partners) ? customer.partners[0] : customer.partners
				const seller = Array.isArray(customer.sellers) ? customer.sellers[0] : customer.sellers
				const isPf = customer.type === "pf"

				return {
					id: customer.id,
					kdi: customer.kdi,
					type: customer.type,
					company_name: isPf ? (customer.name || "") : (customer.company_name || ""),
					cnpj: isPf ? (customer.cpf || "") : (customer.cnpj || ""),
					partner_name: partner?.contact_name || "N/A",
					internal_manager_name: seller?.name || "N/A",
					city: customer.city,
					state: customer.state,
					created_at: customer.created_at
				}
			})

			return mappedData
		}

		// Partner (e qualquer outra role) não vê nenhum parceiro
		return []
	} catch (error) {
		console.error("Erro inesperado em getPartnersForCurrentUser:", error)
		return []
	}
}

export default getCustomersForCurrentUser
