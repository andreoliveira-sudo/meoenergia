"use server"

import type { Customer } from "@/lib/definitions/customers"
import { createClient } from "@/lib/supabase/server"
import type { ActionResponse } from "@/types/action-response"
import logRLSViolation from "@/actions/security/log-rls-violation"

async function getCustomerById(id: string): Promise<ActionResponse<Customer | null>> {
	if (!id) {
		return { success: false, message: "ID do cliente não fornecido." }
	}

	try {
		const supabase = await createClient()

		const { data, error } = await supabase.from("customers").select("*").eq("id", id).is("deleted_at", null).single()

		if (error?.code === "PGRST116") {
			// RLS deny ou registro não existe - retorna como 404 e loga auditoria
			await logRLSViolation({
				tableName: "customers",
				operation: "SELECT",
				attemptedRowId: id,
				reason: "Access denied by RLS (returned as 404)"
			})
			return { success: false, message: "Cliente não encontrado." }
		}

		if (error) {
			console.error("Erro ao buscar cliente por ID:", error)
			return { success: false, message: "Cliente não encontrado ou erro ao buscar dados." }
		}

		return {
			success: true,
			message: "Dados do cliente encontrados.",
			data
		}
	} catch (e) {
		console.error("Erro inesperado em getCustomerById:", e)
		return { success: false, message: "Ocorreu um erro inesperado no servidor." }
	}
}

export default getCustomerById
