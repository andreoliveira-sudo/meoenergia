'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'

import { simulationSchema, type SimulationSchema } from '@/lib/validations/simulation'
import createSimulationAction from '@/actions/simulations/create-simulation'

export const SimulationForm = () => {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const form = useForm<SimulationSchema>({
        resolver: zodResolver(simulationSchema) as any,
        defaultValues: {
            name: '',
            whatsapp: '',
            city: '',
            consumption: 0,
        },
    })

    async function onSubmit(data: SimulationSchema) {
        setIsLoading(true)

        try {
            const result = await createSimulationAction(data)

            if (!result.success) {
                toast.error(result.message)
                setIsLoading(false)
                return
            }

            // Redirect to result page passing params for display (stateless flow)
            const params = new URLSearchParams({
                // id: result.data?.id || 'mock', // Optional
                name: data.name,
                city: data.city,
                consumption: data.consumption.toString(),
            })

            toast.success('Simulação realizada!')
            router.push(`/simulacao/resultado?${params.toString()}`)
        } catch (error) {
            toast.error('Erro ao processar simulação')
            setIsLoading(false)
        }
    }

    return (
        <Card>
            <CardContent className="pt-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Seu nome" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="whatsapp"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Whatsapp</FormLabel>
                                    <FormControl>
                                        <Input placeholder="(00) 00000-0000" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="city"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cidade</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Sua cidade" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="consumption"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Consumo Mensal (kWh)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="Ex: 500"
                                            {...field}
                                            value={field.value || ''}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? 'Calculando...' : 'Simular Economia'}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
