'use server'

import type { ActionResponse } from '@/types/action-response'
import type { SimulationSchema } from '@/lib/validations/simulation'

import { createAdminClient } from '@/lib/supabase/admin'
import { calculateSimulation, type SimulationInput } from '@/lib/calculation-engine'

export default async function createSimulationAction(
	data: SimulationSchema
): Promise<ActionResponse<{ id: string }>> {
	try {
		// 1. Montar input para a engine
		const input: SimulationInput = {
			monthlyConsumption: data.consumption,
			energyRate: 0.75, // Default rate, could be fetched from DB/config
		}

		// 2. Calcular (função pura, sem I/O)
		const result = calculateSimulation(input)

		// 3. Persistir no banco
		const supabase = createAdminClient()
		const { data: insertedData, error } = await supabase
			.from('simulations')
			.insert({
				current_consumption: data.consumption,
				connection_voltage: '127/220V', // Providing a default to satisfy potential logic, though it's nullable now.
				energy_provider: 'Unknown', // Explicitly stating unknown for lead.
				result: { ...result, lead: data },
			})
			.select()
			.single()

		if (error) {
			console.error('Erro ao salvar simulação:', error)
			return { success: false, message: 'Erro ao processar simulação. Tente novamente.' }
		}

		console.log('Simulação criada:', insertedData)

		return {
			success: true,
			message: 'Simulação iniciada com sucesso',
			data: { id: insertedData.id },
		}
	} catch (err) {
		console.error('Erro inesperado na action:', err)
		return { success: false, message: 'Ocorreu um erro inesperado.' }
	}
}
