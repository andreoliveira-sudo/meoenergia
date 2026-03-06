import { SimulationForm } from '@/components/forms/simulation-form'

export const metadata = {
    title: 'Simule sua Economia | MEO ERP',
    description: 'Descubra quanto você pode economizar com energia solar',
}

export default function SimulacaoPage() {
    return (
        <div className="w-full max-w-md mx-auto p-6">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold">Simule sua Economia</h1>
                <p className="text-muted-foreground mt-2">
                    Descubra quanto você pode economizar com energia solar
                </p>
            </div>

            <SimulationForm />
        </div>
    )
}
