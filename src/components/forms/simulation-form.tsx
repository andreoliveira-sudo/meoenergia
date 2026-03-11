'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Building2, Home, Loader2, FileText, ArrowRight } from 'lucide-react'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'

// ✅ Schema separado APENAS para os campos do modal
const modalSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    email: z.string().email('E-mail inválido').min(1, 'E-mail é obrigatório'),
    whatsapp: z.string().min(1, 'WhatsApp é obrigatório'),
})

type ModalSchema = z.infer<typeof modalSchema>

// Tipo para as taxas vindas da API
type RatesData = {
    gestaoPercent: number
    contratacaoPercent: number
    prazos: Array<{ meses: number; taxaJuros: number }>
}

const calcularParcela = (principal: number, taxaMensal: number, meses: number) => {
    if (taxaMensal === 0) return principal / meses
    const fator = Math.pow(1 + taxaMensal, meses)
    return (principal * taxaMensal * fator) / (fator - 1)
}

export const SimulationForm = () => {
    const [step, setStep] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isLoadingRates, setIsLoadingRates] = useState(false)

    // ✅ Estado local simples para clientType e investmentValue
    const [clientType, setClientType] = useState<'pj' | 'pf' | null>(null)
    const [investmentValue, setInvestmentValue] = useState(0)

    // ✅ Taxas dinâmicas do banco de dados
    const [rates, setRates] = useState<RatesData | null>(null)

    // ✅ Form separado apenas para o modal
    const form = useForm<ModalSchema>({
        resolver: zodResolver(modalSchema),
        defaultValues: {
            name: '',
            email: '',
            whatsapp: '',
        },
    })

    // ✅ Buscar taxas do banco quando o tipo de cliente é selecionado
    useEffect(() => {
        if (!clientType) return

        setIsLoadingRates(true)
        const basePath = window.location.pathname.replace(/\/simulacao.*$/, '')

        fetch(`${basePath}/api/rates?type=${clientType}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.error) {
                    console.error('Erro ao buscar taxas:', data.error)
                    toast.error('Erro ao carregar taxas. Tente novamente.')
                    return
                }
                setRates(data)
            })
            .catch((err) => {
                console.error('Erro ao buscar taxas:', err)
                toast.error('Erro ao carregar taxas.')
            })
            .finally(() => setIsLoadingRates(false))
    }, [clientType])

    // Cálculos dinâmicos baseados nas taxas do banco
    const gestaoDecimal = rates ? rates.gestaoPercent / 100 : 0
    const contratacaoDecimal = rates ? rates.contratacaoPercent / 100 : 0
    const tarifaGestao = investmentValue * gestaoDecimal
    const baseContratacao = investmentValue + tarifaGestao
    const tarifaContratacao = baseContratacao * contratacaoDecimal
    const investimentoTotal = investmentValue + tarifaGestao + tarifaContratacao

    const handleClientTypeSelect = (type: 'pj' | 'pf') => {
        setClientType(type)
        setStep(2)
    }

    async function onSubmit(data: ModalSchema) {
        if (!clientType || investmentValue < 1000) {
            toast.error('Dados inválidos')
            return
        }

        setIsLoading(true)

        try {
            const params = new URLSearchParams({
                name: data.name,
                email: data.email,
                whatsapp: data.whatsapp,
                clientType: clientType,
                investmentValue: investmentValue.toString()
            })

            // Detect basePath dynamically (works in both DEV with /meo and PROD without basePath)
            const basePath = window.location.pathname.replace(/\/simulacao.*$/, '')
            window.open(`${basePath}/simulacao/resultado?${params.toString()}`, '_blank')

            toast.success('PDF sendo gerado...')
            setIsModalOpen(false)
        } catch (error) {
            console.error('Erro:', error)
            toast.error('Erro ao gerar PDF')
        } finally {
            setIsLoading(false)
        }
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value)
    }

    return (
        <div className="w-full max-w-5xl mx-auto px-30 space-y-8">
            {/* Step 1: Tipo de Cliente */}
            {step >= 1 && (
                <Card className="p-8 bg-white rounded-2xl shadow-lg">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#1e3a5f] text-white font-bold text-xl">
                            1
                        </div>
                        <h2 className="text-2xl font-bold text-[#1e3a5f]">Selecione o tipo de cliente</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <button
                            type="button"
                            onClick={() => handleClientTypeSelect('pj')}
                            className={`relative p-8 rounded-2xl border-2 transition-all hover:shadow-lg ${
                                clientType === 'pj'
                                    ? 'border-[#c9a961] bg-[#1e3a5f] text-white'
                                    : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-[#c9a961]'
                            }`}
                        >
                            {clientType === 'pj' && (
                                <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#c9a961]" />
                            )}
                            <div className={`flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${
                                clientType === 'pj' ? 'bg-[#2d5078]' : 'bg-gray-200'
                            }`}>
                                <Building2 className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Empresas / Condomínios</h3>
                            <p className={`text-sm ${clientType === 'pj' ? 'text-gray-300' : 'text-gray-500'}`}>
                                Financiamento para pessoa jurídica
                            </p>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleClientTypeSelect('pf')}
                            className={`relative p-8 rounded-2xl border-2 transition-all hover:shadow-lg ${
                                clientType === 'pf'
                                    ? 'border-[#c9a961] bg-[#1e3a5f] text-white'
                                    : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-[#c9a961]'
                            }`}
                        >
                            {clientType === 'pf' && (
                                <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#c9a961]" />
                            )}
                            <div className={`flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${
                                clientType === 'pf' ? 'bg-[#2d5078]' : 'bg-gray-200'
                            }`}>
                                <Home className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Clientes Residenciais</h3>
                            <p className={`text-sm ${clientType === 'pf' ? 'text-gray-300' : 'text-gray-500'}`}>
                                Financiamento para pessoa física
                            </p>
                        </button>
                    </div>
                </Card>
            )}

            {/* Step 2: Valor do Investimento */}
            {step >= 2 && (
                <Card className="p-8 bg-white rounded-2xl shadow-lg">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#1e3a5f] text-white font-bold text-xl">
                            2
                        </div>
                        <h2 className="text-2xl font-bold text-[#1e3a5f]">Informe o valor do investimento</h2>
                    </div>

                    {isLoadingRates ? (
                        <div className="flex items-center justify-center p-8">
                            <Loader2 className="h-6 w-6 animate-spin mr-2" />
                            <span>Carregando taxas...</span>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div>
                                <label className="flex items-center gap-2 text-gray-700 font-medium mb-3">
                                    <FileText className="w-5 h-5" />
                                    Valor do Investimento
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg font-medium">
                                        R$
                                    </span>
                                    <Input
                                        type="text"
                                        placeholder="0,00"
                                        value={investmentValue > 0 ? formatCurrency(investmentValue).replace('R$', '').trim() : ''}
                                        onChange={(e) => {
                                            const digits = e.target.value.replace(/\D/g, '')
                                            const numValue = Number(digits) / 100
                                            setInvestmentValue(numValue)
                                        }}
                                        className="pl-12 h-14 text-lg rounded-xl border-2 focus:border-[#c9a961] focus:ring-[#c9a961]"
                                    />
                                </div>
                            </div>

                            {investmentValue >= 1000 && rates && (
                                <div className="space-y-3 p-6 bg-gray-50 rounded-xl">
                                    <div className="flex justify-between items-center text-gray-700">
                                        <span className="flex items-center gap-2">
                                            <span className="text-2xl">%</span>
                                            Tarifa de Gestão ({rates.gestaoPercent}%)
                                        </span>
                                        <span className="font-semibold">{formatCurrency(tarifaGestao)}</span>
                                    </div>

                                    <div className="flex justify-between items-center text-gray-700">
                                        <span className="flex items-center gap-2">
                                            <FileText className="w-5 h-5" />
                                            Tarifa de Contratação ({rates.contratacaoPercent}%)
                                        </span>
                                        <span className="font-semibold">{formatCurrency(tarifaContratacao)}</span>
                                    </div>

                                    <div className="flex justify-between items-center p-4 bg-[#1e3a5f] text-white rounded-xl mt-4">
                                        <span className="flex items-center gap-2 font-bold text-lg">
                                            <span className="text-2xl">💰</span>
                                            Investimento Total
                                        </span>
                                        <span className="font-bold text-xl text-[#c9a961]">
                                            {formatCurrency(investimentoTotal)}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </Card>
            )}

            {/* Step 3: Tabela de Parcelas */}
            {step >= 2 && investmentValue >= 1000 && rates && (
                <Card className="p-8 bg-white rounded-2xl shadow-lg">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#1e3a5f] text-white font-bold text-xl">
                            3
                        </div>
                        <h2 className="text-2xl font-bold text-[#1e3a5f]">Escolha o melhor prazo para você</h2>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-gray-200">
                        <div className="bg-[#1e3a5f] text-white p-6">
                            <h3 className="text-xl font-bold">Tabela de Parcelas</h3>
                            <p className="text-sm text-gray-300 mt-1">
                                {clientType === 'pj' ? 'Empresas / Condomínios' : 'Clientes Residenciais'}
                            </p>
                        </div>

                        <div className="divide-y divide-gray-200">
                            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 font-semibold text-gray-700">
                                <span>Prazo</span>
                                <span className="text-right">Parcela</span>
                            </div>
                            {rates.prazos.map((item) => {
                                const parcelaCalculada = calcularParcela(investimentoTotal, item.taxaJuros, item.meses)
                                return (
                                    <div key={item.meses} className="grid grid-cols-2 gap-4 p-4 hover:bg-gray-50 transition-colors">
                                        <span className="font-medium text-gray-900">{item.meses} meses</span>
                                        <span className="text-right font-bold text-[#1e3a5f]">
                                            {formatCurrency(parcelaCalculada)}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div className="mt-8">
                        <Button
                            type="button"
                            onClick={() => setIsModalOpen(true)}
                            className="w-full h-16 text-lg font-bold bg-[#c9a961] hover:bg-[#b8974d] text-white rounded-xl shadow-lg"
                        >
                            <FileText className="mr-2 h-5 w-5" />
                            Gerar Proposta em PDF
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </div>

                    {/* Modal */}
                    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader className="bg-[#1e3a5f] text-white -m-6 mb-6 p-6 rounded-t-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-[#c9a961] flex items-center justify-center">
                                        <FileText className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <DialogTitle className="text-xl font-bold text-white">Gerar Proposta</DialogTitle>
                                        <DialogDescription className="text-gray-200">
                                            Preencha seus dados para continuar
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>

                            {/* ✅ Form usa apenas o modalSchema — sem campos extras bloqueando */}
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                    Nome Completo
                                                </FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Seu nome" {...field} className="h-12" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                    </svg>
                                                    E-mail
                                                </FormLabel>
                                                <FormControl>
                                                    <Input type="email" placeholder="seu@email.com" {...field} className="h-12" />
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
                                                <FormLabel className="flex items-center gap-2">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                    </svg>
                                                    WhatsApp
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="(00) 00000-0000"
                                                        {...field}
                                                        onChange={(e) => {
                                                            const value = e.target.value.replace(/\D/g, '')
                                                            const masked = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
                                                            field.onChange(masked)
                                                        }}
                                                        maxLength={15}
                                                        className="h-12"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full h-12 bg-[#c9a961] hover:bg-[#b8974d] text-white font-semibold"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Gerando Proposta...
                                            </>
                                        ) : (
                                            <>
                                                <FileText className="mr-2 h-4 w-4" />
                                                Gerar Proposta em PDF
                                            </>
                                        )}
                                    </Button>

                                    <p className="text-xs text-center text-gray-500 mt-4">
                                        Ao continuar, você concorda em receber comunicações sobre nossos serviços.
                                    </p>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </Card>
            )}
        </div>
    )
}
