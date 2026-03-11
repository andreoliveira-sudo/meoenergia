"use server"

import type { CustomerWithRelations } from "@/lib/definitions/customers"
import { createClient } from "@/lib/supabase/server"

async function getAllCustomers(): Promise<CustomerWithRelations[]> {
	try {
		const supabase = await createClient()

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
			.order("kdi", { ascending: false }).range(0, 9999)

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
	} catch (error) {
		console.error("Erro inesperado em getAllCustomers:", error)
		return []
	}
}

export default getAllCustomers
