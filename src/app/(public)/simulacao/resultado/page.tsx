import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

interface Props {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export const metadata = {
    title: 'Resultado da Simulação | MEO Energia',
}

export default async function SimulationResultPage({ searchParams }: Props) {
    const params = await searchParams

    const consumption = Number(params.consumption) || 0
    const city = (params.city as string) || ''

    if (consumption <= 0) {
        redirect('/simulacao')
    }

    // Mock calculation: 
    // Assuming tariff ~1.00 R$/kWh and 95% savings
    const monthlyCost = consumption * 1.05 // R$ 1.05/kWh estimated
    const monthlySavings = monthlyCost * 0.95
    const annualSavings = monthlySavings * 12

    // CTA Link with pre-filled params
    const signUpUrl = `/?view=register&type=pf&consumption=${consumption}&city=${encodeURIComponent(city)}`

    return (
        <div className="w-full max-w-lg mx-auto p-6 space-y-8 animate-in fade-in duration-500">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Resultado da Simulação</h1>
                <p className="text-muted-foreground">
                    Baseado no consumo de {consumption} kWh/mês
                </p>
            </div>

            <Card className="border-2 border-primary/20 shadow-lg">
                <CardContent className="pt-6 text-center space-y-6">
                    <div className="space-y-2">
                        <h2 className="text-lg font-medium text-muted-foreground">
                            Sua economia estimada
                        </h2>
                        <div className="space-y-1">
                            <p className="text-4xl md:text-5xl font-extrabold text-green-600">
                                {formatCurrency(annualSavings)}
                                <span className="text-base font-normal text-muted-foreground ml-1">
                                    /ano
                                </span>
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {formatCurrency(monthlySavings)} por mês
                            </p>
                        </div>
                    </div>

                    <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                            *Valores estimados com base na tarifa média da região.
                            Para uma proposta exata, fale com nossos consultores.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4">
                <Button asChild size="lg" className="w-full text-lg h-14 shadow-md font-semibold">
                    <Link href={signUpUrl}>
                        Quero Garantir Essa Economia
                    </Link>
                </Button>

                <Button asChild variant="ghost" className="w-full">
                    <Link href="/simulacao">Refazer Simulação</Link>
                </Button>
            </div>
        </div>
    )
}
