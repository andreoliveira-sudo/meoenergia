"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import type { ActionResponse } from "@/types/action-response"

const BUCKET_NAME = "docs_simulation"

async function listOrderFiles(orderId: string): Promise<ActionResponse<{ name: string }[]>> {
	if (!orderId) {
		return { success: false, message: "ID do pedido não fornecido." }
	}

	const supabase = createAdminClient()

	try {
		// 1. Obter o simulation_id a partir do order_id
		const { data: orderData, error: orderError } = await supabase.from("orders").select("id").eq("id", orderId).single()

		if (orderError || !orderData) {
			return { success: false, message: "Pedido não encontrado." }
		}

		const simulationId = orderData.id // O ID do pedido é o mesmo da simulação

		// 2. Listar os arquivos usando o simulation_id
		const { data, error } = await supabase.storage.from(BUCKET_NAME).list(simulationId)

		if (error) {
			console.error(`Erro ao listar arquivos do pedido ${orderId} (sim_id: ${simulationId}):`, error)
			return { success: false, message: "Não foi possível buscar a lista de arquivos." }
		}

		return {
			success: true,
			message: "Arquivos encontrados.",
			data: data.map((file) => ({ name: file.name }))
		}
	} catch (e) {
		console.error("Erro inesperado em listOrderFiles:", e)
		const errorMessage = e instanceof Error ? e.message : "Ocorreu um erro desconhecido."
		return {
			success: false,
			message: `Ocorreu um erro inesperado no servidor: ${errorMessage}`
		}
	}
}

export default listOrderFiles
