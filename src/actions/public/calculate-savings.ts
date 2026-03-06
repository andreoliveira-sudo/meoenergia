'use server'

import { calculateSimulation, type SimulationInput } from '@/lib/calculation-engine'
import type { ActionResponse } from '@/types/action-response'
import { z } from 'zod'

const calculateSavingsSchema = z.object({
    consumption: z.coerce.number().min(1, 'Informe seu consumo mensal'),
    city: z.string().min(2, 'Informe sua cidade'),
})

type CalculateSavingsSchema = z.infer<typeof calculateSavingsSchema>

export default async function calculateSavingsAction(
    data: CalculateSavingsSchema
): Promise<ActionResponse<ReturnType<typeof calculateSimulation>>> {
    try {
        const validation = calculateSavingsSchema.safeParse(data)
        if (!validation.success) {
            return {
                success: false,
                message: validation.error.issues[0].message,
            }
        }

        console.log('Calculating savings (stateless):', data)

        const input: SimulationInput = {
            monthlyConsumption: data.consumption,
            energyRate: 0.75, // Default rate
        }

        const result = calculateSimulation(input)

        return {
            success: true,
            message: 'Cálculo realizado com sucesso',
            data: result,
        }
    } catch (error) {
        console.error('Error calculating savings:', error)
        return {
            success: false,
            message: 'Erro ao calcular economia',
        }
    }
}
