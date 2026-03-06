import { z } from 'zod'

export const simulationSchema = z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    whatsapp: z.string().min(10, 'Whatsapp inválido'),
    city: z.string().min(2, 'Informe sua cidade'),
    consumption: z.coerce.number().min(1, 'Informe seu consumo mensal'),
})

export type SimulationSchema = z.infer<typeof simulationSchema>
