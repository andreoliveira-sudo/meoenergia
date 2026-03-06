"use server"

import type { SimulationWithRelations } from "@/lib/definitions/simulations"
import { createClient } from "@/lib/supabase/server"

async function getAllSimulations(): Promise<SimulationWithRelations[]> {
	try {
		const supabase = await createClient()

		const { data: { user }, error: authError } = await supabase.auth.getUser()

		if (authError || !user) {
			console.error("Usuário não autenticado")
			return []
		}

		// Buscar role do usuário
		const { data: roleData } = await supabase
			.from('users')
			.select('role')
			.eq('id', user.id)
			.single()

		const isAdmin = roleData?.role === 'admin'

		let query = supabase
			.from("simulations")
			.select(
				`
        id,
        kdi,
        system_power,
        equipment_value,
        labor_value,
        other_costs,
        created_at,
        status,
        customers (
          id,
          cnpj,
          company_name,
          name,
          cpf,
          city,
          state,
          partners ( contact_name, legal_business_name )
        ),
        sellers (
          name
        ),
				service_fee_60,
				created_by:created_by_user_id ( name )
      `
			)
			.order("created_at", { ascending: false })

		if (!isAdmin) {
			query = query.eq('created_by_user_id', user.id)
		}

		const { data, error } = await query

		if (error) {
			console.error("Erro ao buscar simulações com detalhes:", error)
			return []
		}

		// Mapeia os dados para a estrutura final, incluindo o cálculo do valor total
		const mappedData = data.map((sim) => {
			const customerData = sim.customers
			const customer = Array.isArray(customerData) ? customerData[0] : customerData

			if (!customer) {
				return null // Se não houver cliente, não podemos processar esta simulação
			}

			const subtotal = (sim.equipment_value || 0) + (sim.labor_value || 0) + (sim.other_costs || 0)
			const fee = sim.service_fee_60 ?? 0
			const total_value = subtotal + subtotal * (fee / 100)

			const partnerData = customer.partners
			const partner = Array.isArray(partnerData) ? partnerData[0] : partnerData

			const sellerData = sim.sellers
			const seller = Array.isArray(sellerData) ? sellerData[0] : sellerData

			const creatorData = sim.created_by
			const creator = Array.isArray(creatorData) ? creatorData[0] : creatorData

			// Fallback para nome do cliente (PJ usa company_name, PF usa name)
			const customerName = customer.company_name || customer.name || "N/A"

			return {
				id: sim.id,
				customerId: customer.id,
				kdi: sim.kdi,
				cnpj: customer.cnpj || customer.cpf || "N/A",
				company_name: customerName,
				city: customer.city || "N/A",
				state: customer.state || "N/A",
				partner_name: partner?.legal_business_name || "N/A",
				internal_manager: seller?.name || null,
				system_power: sim.system_power,
				total_value,
				status: sim.status,
				created_at: sim.created_at,
				created_by_user: creator?.name || "N/A"
			}
		})

		return mappedData.filter((d): d is SimulationWithRelations => d !== null)
	} catch (error) {
		console.error("Erro inesperado em getAllSimulations:", error)
		return []
	}
}

export default getAllSimulations
