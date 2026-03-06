"use server"

import { PostgrestError } from "@supabase/supabase-js"

import type { OrderInsert } from "@/lib/definitions/orders"
import { createAdminClient } from "@/lib/supabase/admin"
import type { ActionResponse } from "@/types/action-response"

const BUCKET_NAME = "docs_simulation"

async function createOrderFromSimulation(simulationId: string): Promise<ActionResponse<{ orderId: string }>> {
	if (!simulationId) {
		return { success: false, message: "ID da simulação não fornecido." }
	}

	const supabaseAdmin = createAdminClient()
	let newOrderId: string | null = null

	try {
		// 1. Buscar os dados completos da simulação
		const { data: simulation, error: fetchError } = await supabaseAdmin.from("simulations").select("*").eq("id", simulationId).single()

		if (fetchError || !simulation) {
			console.error("Erro ao buscar simulação para criar pedido:", fetchError)
			return { success: false, message: "Não foi possível encontrar a simulação de origem." }
		}

		// Verificação de segurança: Customer ID é obrigatório
		if (!simulation.customer_id || simulation.customer_id.trim() === "") {
			return {
				success: false,
				message: "Esta simulação não está vinculada a um cliente. Finalize o cadastro do cliente antes de gerar o pedido."
			}
		}

		// 2. Preparar os dados para a nova tabela 'orders'
		const orderData: OrderInsert = {
			connection_voltage: simulation.connection_voltage ?? "",
			created_by_user_id: simulation.created_by_user_id,
			current_consumption: simulation.current_consumption,
			customer_id: simulation.customer_id, // Agora garantido que existe
			energy_provider: simulation.energy_provider ?? "",
			equipment_value: simulation.equipment_value ?? 0,
			kit_inverter_id: simulation.kit_inverter_id ?? 0,
			kit_module_id: simulation.kit_module_id ?? 0,
			kit_others: simulation.kit_others,
			labor_value: simulation.labor_value ?? 0,
			other_costs: simulation.other_costs ?? 0,
			seller_id: simulation.seller_id,
			status: "analysis_pending",
			structure_type: simulation.structure_type ?? "",
			system_power: simulation.system_power ?? 0,
			notes: simulation.notes,
			// Taxas - usar valores padrão se não existirem na simulação
			interest_rate_36: simulation.interest_rate_36 ?? 0,
			interest_rate_48: simulation.interest_rate_48 ?? 0,
			interest_rate_60: simulation.interest_rate_60 ?? 0,
			service_fee_36: simulation.service_fee_36 ?? 0,
			service_fee_48: simulation.service_fee_48 ?? 0,
			service_fee_60: simulation.service_fee_60 ?? 0
		}

		// 3. Inserir na tabela 'orders'
		const { data: newOrder, error: insertError } = await supabaseAdmin.from("orders").insert(orderData).select("id").single()

		if (insertError) {
			console.error("Erro ao criar pedido (Supabase):", insertError)
			if (insertError instanceof PostgrestError && insertError.code === "23503") {
				return { success: false, message: "Erro de referência ao criar pedido. Verifique se os dados relacionados ainda existem." }
			}
			throw insertError // Lança para o catch principal
		}

		newOrderId = newOrder.id

		// Nota: A simulação NÃO é deletada - ela permanece com status "won" para histórico

		// 4. Listar arquivos do bucket da simulação
		const { data: files, error: listError } = await supabaseAdmin.storage.from(BUCKET_NAME).list(simulationId)

		if (listError) {
			console.error(`Erro ao listar arquivos da simulação ${simulationId}:`, listError)
			throw new Error(`Falha ao listar documentos da simulação de origem: ${listError.message}`)
		}

		// 5. Copiar cada arquivo para o novo diretório do pedido
		if (files && files.length > 0) {
			for (const file of files) {
				const fromPath = `${simulationId}/${file.name}`
				const toPath = `${newOrderId}/${file.name}`
				const { error: copyError } = await supabaseAdmin.storage.from(BUCKET_NAME).copy(fromPath, toPath)

				if (copyError) {
					console.error(`Erro ao copiar arquivo ${fromPath} para ${toPath}:`, copyError)
					throw new Error(`Falha ao copiar documento: ${file.name}. A operação foi cancelada.`)
				}
			}
		}

		return {
			success: true,
			message: `Pedido #${newOrder.id} criado com sucesso!`,
			data: {
				orderId: newOrderId
			}
		}
	} catch (e) {
		console.error("Erro inesperado em createOrderFromSimulation:", e)

		// Ação de compensação: se o pedido foi criado mas a cópia de arquivos falhou, removemos o pedido.
		if (newOrderId) {
			await supabaseAdmin.from("orders").delete().eq("id", newOrderId)
			// Também podemos tentar deletar a pasta do novo pedido no storage se ela foi criada
			const { data: newFiles } = await supabaseAdmin.storage.from(BUCKET_NAME).list(newOrderId)
			if (newFiles && newFiles.length > 0) {
				const filesToRemove = newFiles.map((f) => `${newOrderId}/${f.name}`)
				await supabaseAdmin.storage.from(BUCKET_NAME).remove(filesToRemove)
			}
		}

		const errorMessage = e instanceof Error ? e.message : "Ocorreu um erro desconhecido."
		return {
			success: false,
			message: `Ocorreu um erro inesperado: ${errorMessage}`
		}
	}
}

export default createOrderFromSimulation
