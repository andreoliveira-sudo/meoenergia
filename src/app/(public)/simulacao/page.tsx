import { SimulationForm } from '@/components/forms/simulation-form'

export const metadata = {
    title: 'Simulador de Leasing Solar | MEO',
    description: 'Simule seu financiamento de forma rápida e transparente',
}

export default function SimulacaoPage() {
    return (
        // ✅ Adicione classes para remover espaçamento
        <div className="w-full bg-gradient-to-br from-[#1e3a5f] via-[#2d5078] to-[#1e3a5f]">
           {/* Hero Section com fundo azul */}
            <div className="relative bg-gradient-to-br from-[#1e3a5f] to-[#2d5078] text-white pt-16 pb-32">
                <div className="w-full max-w-7xl mx-auto">
                    {/* Logo */}
                    <div className="text-center mb-12">
                        <h1 className="text-6xl font-bold mb-2">MEO</h1>
                        <p className="text-sm tracking-wider opacity-90">Leasing</p>
                    </div>
                    
                    {/* Título Principal */}
                    <div className="text-center mb-16">
                        <h2 className="text-5xl font-bold mb-6">
                            Simulador de Leasing Solar
                        </h2>
                        <p className="text-xl text-gray-200 max-w-3xl mx-auto leading-relaxed">
                            Simule seu financiamento de forma rápida e transparente. Descubra as melhores condições para você ou sua empresa.
                        </p>
                    </div>

                    {/* Cards de Benefícios */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20">
                            <div className="w-16 h-16 rounded-full bg-[#c9a961] flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold mb-2">Taxas a partir de 1,49%</h3>
                            <p className="text-sm text-gray-200">As melhores condições do mercado</p>
                        </div>

                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20">
                            <div className="w-16 h-16 rounded-full bg-[#c9a961] flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold mb-2">Prazos até 96 meses</h3>
                            <p className="text-sm text-gray-200">Flexibilidade para seu negócio</p>
                        </div>

                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20">
                            <div className="w-16 h-16 rounded-full bg-[#c9a961] flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold mb-2">Aprovação em 24h</h3>
                            <p className="text-sm text-gray-200">Processo rápido e eficiente</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Formulário com fundo branco */}
            <div className="bg-white pb-20">
                <div className="w-full max-w-7xl relative -mt-20 mx-auto">
                    <SimulationForm />
                </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-gray-100 py-8">
                <div className="w-full max-w-7xl mx-auto">
                    <p className="text-center text-sm text-gray-600">
                        A MEO atua exclusivamente como correspondente/intermediária de crédito, não sendo instituição financeira, nos termos da regulamentação do Banco Central do Brasil, e não realiza concessão direta de crédito.
                    </p>
                </div>
            </div>
        </div>
    )
}