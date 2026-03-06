"use server"

import type { Tables, TablesInsert } from "@/lib/definitions/supabase"
import { createClient } from "@/lib/supabase/server"
import type { ActionResponse } from "@/types/action-response"

export async function duplicateSimulation(simulationId: string): Promise<ActionResponse<{ id: string; kdi: number }>> {
	if (!simulationId) {
		return {
			success: false,
			message: "ID da simulação não fornecido."
		}
	}

	const supabase = await createClient()

	// 1. Buscar a simulação original
	const { data: original, error } = await supabase.from("simulations").select("*").eq("id", simulationId).single<Tables<"simulations">>()

	if (error || !original) {
		console.error("Erro ao buscar simulação para duplicação:", error)
		return {
			success: false,
			message: "Não foi possível encontrar a simulação para duplicação."
		}
	}

	// 2. Remover campos que não devem ser reaproveitados
	const { id: _id, kdi: _kdi, created_at: _createdAt, updated_at: _updatedAt, ...cloneBase } = original

	// 3. Montar o payload de inserção
	const newSimulation: TablesInsert<"simulations"> = {
		...cloneBase
		// se quiser forçar algum valor novo (ex: status inicial), faz aqui:
		// status: "pending"
	}

	// 4. Inserir a nova simulação
	const { data: inserted, error: insertError } = await supabase
		.from("simulations")
		.insert(newSimulation)
		.select("id, kdi")
		.single<{ id: string; kdi: number }>()

	if (insertError || !inserted) {
		console.error("Erro ao duplicar simulação:", insertError)
		return {
			success: false,
			message: "Ocorreu um erro ao duplicar a simulação."
		}
	}

	return {
		success: true,
		message: `Simulação #${inserted.kdi} criada com base na simulação duplicada.`,
		data: inserted
	}
}
