"use server"
// src/actions/simulations/get-simulations-for-current-user.ts

import { getCurrentUser } from "@/actions/auth"
import type { SimulationWithRelations } from "@/lib/definitions/simulations"
import { createAdminClient } from "@/lib/supabase/admin"
import { getAllSimulations } from "."

/**
 * Busca simulações com base na função do usuário logado.
 * - Admin: Vê todas as simulações.
 * - Seller: Vê apenas as simulações de clientes associados a ele.
 * - Partner: Vê as simulações de clientes associados a ele.
 */
async function getSimulationsForCurrentUser(): Promise<SimulationWithRelations[]> {
	const user = await getCurrentUser()
	const supabase = createAdminClient()

	if (!user || !user.id || !user.role) {
		console.error("Usuário não autenticado ou sem função definida.")
		return []
	}

	if (user.role === "admin") {
		return await getAllSimulations()
	}

	if (user.role === "seller") {
		const { data: seller, error: sellerError } = await supabase.from("sellers").select("id").eq("user_id", user.id).is("deleted_at", null).single()

		if (sellerError || !seller) {
			console.error("Vendedor não encontrado para o usuário atual:", sellerError)
			return []
		}

		// SOLUÇÃO 1: Buscar primeiro os customer_ids do vendedor
		const { data: customerIds, error: customerError } = await supabase.from("customers").select("id").eq("internal_manager", seller.id).is("deleted_at", null)

		if (customerError) {
			console.error("Erro ao buscar clientes do vendedor:", customerError)
			return []
		}

		if (!customerIds || customerIds.length === 0) {
			return []
		}

		const customerIdArray = customerIds.map((c) => c.id)

		const { data, error } = await supabase
			.from("simulations")
			.select(
				`
				id,
				kdi,
				status,
				created_at,
				system_power,
				equipment_value,
				labor_value,
				other_costs,
				customer_id,
				customers (
					cnpj,
					company_name,
					name,
					cpf,
					city,
					state,
					partners ( contact_name, legal_business_name )
				),
				sellers ( name ),
				service_fee_60,
				created_by:created_by_user_id ( name )
				`
			)
			.is("deleted_at", null)
			.in("customer_id", customerIdArray) // Usar .in() com os IDs dos clientes
			.order("created_at", { ascending: false })

		if (error) {
			console.error("Erro ao buscar simulações para o vendedor:", error)
			return []
		}

		const finalMappedData: SimulationWithRelations[] = data.map((sim) => {
			const subtotal = (sim.equipment_value || 0) + (sim.labor_value || 0) + (sim.other_costs || 0)
			const fee = sim.service_fee_60 || 0
			const total_value = subtotal + subtotal * (fee / 100)

			const customerData = sim.customers && (Array.isArray(sim.customers) ? sim.customers[0] : sim.customers)
			const partners = customerData?.partners
			const partner = partners && (Array.isArray(partners) ? partners[0] : partners)

			return {
				id: sim.id,
				kdi: sim.kdi,
				customerId: sim.customer_id || "",
				cnpj: customerData?.cnpj || customerData?.cpf || "N/A",
				company_name: customerData?.company_name || customerData?.name || "N/A",
				city: customerData?.city || "N/A",
				state: customerData?.state || "N/A",
				system_power: sim.system_power || 0,
				total_value,
				status: sim.status,
				created_at: sim.created_at,
				internal_manager: sim.sellers?.name || null,
				partner_name: partner?.legal_business_name || null,
				created_by_user: sim.created_by?.name || "N/A"
			}
		})

		return finalMappedData
	}

	if (user.role === "partner") {
		const { data: partner, error: partnerError } = await supabase.from("partners").select("id").eq("user_id", user.id).is("deleted_at", null).single()

		if (partnerError || !partner) {
			console.error("Parceiro não encontrado para o usuário atual:", partnerError)
			return []
		}

		// SOLUÇÃO 1: Buscar primeiro os customer_ids do parceiro
		const { data: customerIds, error: customerError } = await supabase.from("customers").select("id").eq("partner_id", partner.id).is("deleted_at", null)

		if (customerError) {
			console.error("Erro ao buscar clientes do parceiro:", customerError)
			return []
		}

		if (!customerIds || customerIds.length === 0) {
			return []
		}

		const customerIdArray = customerIds.map((c) => c.id)

		const { data, error } = await supabase
			.from("simulations")
			.select(
				`
				id,
				kdi,
				status,
				created_at,
				system_power,
				equipment_value,
				labor_value,
				other_costs,
				customer_id,
				customers (
					cnpj,
					company_name,
					name,
					cpf,
					city,
					state,
					partners ( contact_name, legal_business_name )
				),
				sellers ( name ),
				service_fee_60,
				created_by:created_by_user_id ( name )
				`
			)
			.is("deleted_at", null)
			.in("customer_id", customerIdArray) // Usar .in() com os IDs dos clientes
			.order("created_at", { ascending: false })

		if (error) {
			console.error("Erro ao buscar simulações para o parceiro:", error)
			return []
		}

		const finalMappedData: SimulationWithRelations[] = data.map((sim) => {
			const subtotal = (sim.equipment_value || 0) + (sim.labor_value || 0) + (sim.other_costs || 0)
			const fee = sim.service_fee_60 || 0
			const total_value = subtotal + subtotal * (fee / 100)

			const customerData = sim.customers && (Array.isArray(sim.customers) ? sim.customers[0] : sim.customers)
			const partners = customerData?.partners
			const partner = partners && (Array.isArray(partners) ? partners[0] : partners)

			return {
				id: sim.id,
				kdi: sim.kdi,
				customerId: sim.customer_id || "",
				cnpj: customerData?.cnpj || customerData?.cpf || "N/A",
				company_name: customerData?.company_name || customerData?.name || "N/A",
				city: customerData?.city || "N/A",
				state: customerData?.state || "N/A",
				system_power: sim.system_power || 0,
				total_value,
				status: sim.status,
				created_at: sim.created_at,
				internal_manager: sim.sellers?.name || null,
				partner_name: partner?.legal_business_name || null,
				created_by_user: sim.created_by?.name || "N/A"
			}
		})

		return finalMappedData
	}

	return []
}

export default getSimulationsForCurrentUser
