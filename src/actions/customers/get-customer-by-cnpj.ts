"use server"

import type { Customer } from "@/lib/definitions/customers"
import { createClient } from "@/lib/supabase/server"
import type { ActionResponse } from "@/types/action-response"

/**
 * Busca um cliente no banco de dados pelo seu CNPJ.
 * @param cnpj O CNPJ a ser pesquisado.
 * @returns Um ActionResponse contendo os dados do cliente se encontrado, ou null caso contrário.
 */
async function getCustomerByCnpj(cnpj: string): Promise<ActionResponse<Customer | null>> {
	const cleanedCnpj = cnpj.replace(/\D/g, "")
	if (cleanedCnpj.length !== 14) {
		return { success: false, message: "CNPJ inválido." }
	}

	try {
		const supabase = await createClient()
		const { data: customer, error } = await supabase.from("customers").select("*").eq("cnpj", cleanedCnpj).maybeSingle()

		if (error) {
			console.error("Erro ao buscar cliente por CNPJ:", error)
			return { success: false, message: "Erro ao consultar o banco de dados." }
		}

		if (customer) {
			return { success: true, message: "Cliente encontrado.", data: customer }
		}

		return { success: true, message: "Cliente não encontrado.", data: null }
	} catch (e) {
		console.error("Erro inesperado em getCustomerByCnpj:", e)
		return { success: false, message: "Ocorreu um erro inesperado no servidor." }
	}
}

export default getCustomerByCnpj
