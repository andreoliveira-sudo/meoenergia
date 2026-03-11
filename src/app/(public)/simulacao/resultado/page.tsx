'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, useRef, Suspense } from 'react'

interface RatesData {
    gestaoPercent: number
    contratacaoPercent: number
    prazos: { meses: number; taxaJuros: number }[]
}

function SimulacaoResultadoContent() {
    const searchParams = useSearchParams()
    const [calculations, setCalculations] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [pdfReady, setPdfReady] = useState(false)
    const [currentDate, setCurrentDate] = useState('')
    const [rates, setRates] = useState<RatesData | null>(null)
    const pdfTriggered = useRef(false)

    const name = searchParams.get('name') || ''
    const email = searchParams.get('email') || ''
    const whatsapp = searchParams.get('whatsapp') || ''
    const clientType = searchParams.get('clientType') || 'pf'
    const investmentValue = Number(searchParams.get('investmentValue')) || 0

    const clientTypeLabel = clientType === 'pf' ? 'Pessoa Física' : 'Empresas / Condomínios'

    useEffect(() => {
        setCurrentDate(
            new Date().toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
            })
        )
    }, [])

    // Fetch rates from API
    useEffect(() => {
        if (!clientType) return
        const basePath = typeof window !== 'undefined'
            ? window.location.pathname.replace(/\/simulacao.*$/, '')
            : ''
        fetch(`${basePath}/api/rates?type=${clientType}`)
            .then(res => res.json())
            .then((data: RatesData) => setRates(data))
            .catch(err => {
                console.error('Error fetching rates:', err)
                // Fallback hardcoded in case API fails
                if (clientType === 'pf') {
                    setRates({
                        gestaoPercent: 8, contratacaoPercent: 8,
                        prazos: [
                            { meses: 24, taxaJuros: 0.0286 }, { meses: 30, taxaJuros: 0.0261 },
                            { meses: 36, taxaJuros: 0.0261 }, { meses: 48, taxaJuros: 0.0247 },
                            { meses: 60, taxaJuros: 0.024 }, { meses: 72, taxaJuros: 0.0237 },
                            { meses: 84, taxaJuros: 0.0236 }, { meses: 96, taxaJuros: 0.0237 },
                        ]
                    })
                } else {
                    setRates({
                        gestaoPercent: 4, contratacaoPercent: 8,
                        prazos: [
                            { meses: 24, taxaJuros: 0.026 }, { meses: 36, taxaJuros: 0.026 },
                            { meses: 48, taxaJuros: 0.026 }, { meses: 60, taxaJuros: 0.026 },
                        ]
                    })
                }
            })
    }, [clientType])

    // Dynamic values from rates
    const managementFeePercent = rates?.gestaoPercent ?? (clientType === 'pf' ? 8 : 4)
    const serviceFeePercent = rates?.contratacaoPercent ?? 8
    const managementFeeValue = investmentValue * (managementFeePercent / 100)
    const baseContratacao = investmentValue + managementFeeValue
    const serviceFeeValue = baseContratacao * (serviceFeePercent / 100)
    const totalInvestment = investmentValue + managementFeeValue + serviceFeeValue

    // Calculate installments when rates are loaded
    useEffect(() => {
        if (!rates) return

        const mgmtFee = investmentValue * (rates.gestaoPercent / 100)
        const base = investmentValue + mgmtFee
        const svcFee = base * (rates.contratacaoPercent / 100)
        const total = investmentValue + mgmtFee + svcFee

        const calcs = rates.prazos.map(item => {
            const rate = item.taxaJuros
            const fator = Math.pow(1 + rate, item.meses)
            const installment = (total * rate * fator) / (fator - 1)
            return { month: item.meses, ratePercent: item.taxaJuros * 100, installment }
        })

        setCalculations(calcs)
        setLoading(false)
    }, [rates, investmentValue])

    useEffect(() => {
        if (loading || !currentDate || pdfTriggered.current) return
        pdfTriggered.current = true

        const loadScript = (src: string): Promise<void> =>
            new Promise((resolve, reject) => {
                if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
                const s = document.createElement('script')
                s.src = src
                s.onload = () => resolve()
                s.onerror = () => reject(new Error(`Falha ao carregar: ${src}`))
                document.head.appendChild(s)
            })

        const patchColors = (doc: Document) => {
            const pattern = /^(lab|oklch|lch|color)\(/
            doc.querySelectorAll('*').forEach(el => {
                const htmlEl = el as HTMLElement
                const cs = doc.defaultView?.getComputedStyle(htmlEl)
                if (!cs) return
                ;(['backgroundColor', 'color', 'borderTopColor', 'borderRightColor',
                    'borderBottomColor', 'borderLeftColor'] as const).forEach(prop => {
                    const val = cs[prop as keyof CSSStyleDeclaration] as string
                    if (val && pattern.test(val)) {
                        htmlEl.style[prop as any] = prop === 'backgroundColor' ? '#ffffff' : '#000000'
                    }
                })
            })
        }

        const generatePDF = async () => {
            const overlay = document.getElementById('loadingOverlay')
            if (overlay) overlay.style.display = 'flex'

            try {
                await loadScript('https://html2canvas.hertzen.com/dist/html2canvas.min.js')
                await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')
                await new Promise(r => setTimeout(r, 300))

                const html2canvas = (window as any).html2canvas
                const jspdfLib = (window as any).jspdf || { jsPDF: (window as any).jsPDF }

                if (!html2canvas || !jspdfLib?.jsPDF) throw new Error('Bibliotecas não carregadas')

                const element = document.querySelector('.pdf-container') as HTMLElement
                if (!element) throw new Error('Elemento .pdf-container não encontrado')

                const canvas = await html2canvas(element, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff',
                    onclone: (clonedDoc: Document) => {
                        const ov = clonedDoc.getElementById('loadingOverlay')
                        if (ov) ov.style.display = 'none'
                        patchColors(clonedDoc)
                    },
                })

                const imgData = canvas.toDataURL('image/png', 1.0)
                const pdf = new jspdfLib.jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
                const imgWidth = 210
                const imgHeight = (canvas.height * imgWidth) / canvas.width
                pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
                pdf.save('proposta-leasing-meo.pdf')

                if (overlay) overlay.style.display = 'none'
                setTimeout(() => window.close(), 1000)
            } catch (error) {
                console.error('Erro ao gerar PDF:', error)
                if (overlay) overlay.style.display = 'none'
                setPdfReady(true)
            }
        }

        setTimeout(generatePDF, 800)
    }, [loading, currentDate])

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

    if (loading || !currentDate) {
        return (
            <>
                <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.95)',
                    display: 'flex', flexDirection: 'column', justifyContent: 'center',
                    alignItems: 'center', fontFamily: 'sans-serif',
                }}>
                    <div style={{
                        width: 50, height: 50, border: '5px solid #f3f3f3',
                        borderTop: '5px solid #2c4156', borderRadius: '50%',
                        animation: 'spin 1s linear infinite', marginBottom: 20,
                    }} />
                    <div style={{ color: '#2c4156', fontSize: 16, fontWeight: 500 }}>
                        Preparando proposta...
                    </div>
                </div>
            </>
        )
    }

    return (
        <>
            <style jsx global>{`
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Inter', 'Segoe UI', 'Helvetica', 'Arial', sans-serif;
                    color: #2c4156; line-height: 1.6; background: #ffffff;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                .pdf-container {
                    width: 210mm; height: 297mm; margin: 0 auto; background: white;
                    box-shadow: 0 0 20px rgba(0,0,0,0.1); display: flex; flex-direction: column;
                }
                .header {
                    background: linear-gradient(90deg, #1e3a5f 0%, #2d4a6f 100%);
                    color: white; padding: 12px 25px;
                    display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;
                }
                .brand h1 { font-size: 28px; font-weight: 700; letter-spacing: 4px; margin: 0; line-height: 1; text-align: center; }
                .brand .tagline { font-size: 9px; margin-top: 4px; font-weight: 300; letter-spacing: 2.5px; text-align: center; }
                .header-right { text-align: right; }
                .main-title { font-size: 16px; font-weight: 600; margin: 0; line-height: 1.2; }
                .subtitle { font-size: 10px; font-weight: 300; opacity: 0.9; }
                .content { padding: 12px 25px; flex: 1; overflow: hidden; }
                .section { margin-bottom: 12px; }
                .section-title { font-size: 12px; font-weight: 700; color: #2c4156; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 2px solid #d3a22e; }
                .client-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
                .client-field { display: flex; flex-direction: column; background: #f4f4f4; border-radius: 4px; padding: 4px; }
                .field-label { font-size: 8px; color: #42494f; text-transform: uppercase; letter-spacing: 0.4px; font-weight: 500; }
                .field-value { font-size: 10px; color: #2d4a6f; font-weight: 600; margin-bottom: 8px}
                .finance-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
                .total-card { background: linear-gradient(90deg, #1e3a5f 0%, #2d4a6f 100%); border-radius: 6px; padding: 12px; margin-top: 12px; text-align: center; }
                .total-label { font-size: 8px; color: white; font-weight: 400; text-transform: uppercase; }
                .total-amount { font-size: 14px; color: #d3a22e; font-weight: 800; letter-spacing: 1.5px; }
                .installment-table { width: 100%; border-collapse: collapse; background: white; margin-top: 8px; }
                .installment-table thead { background: linear-gradient(90deg, #1e3a5f 0%, #2d4a6f 100%); color: white; }
                .installment-table th { padding: 6px 8px; text-align: left; font-size: 9px; font-weight: 600; text-transform: uppercase; }
                .installment-table tbody tr { border-bottom: 1px solid #e9ecef; }
                .installment-table tbody tr:nth-child(even) { background: #fafbfc; }
                .installment-table td { padding: 2px 8px 6px 8px; font-size: 9px; color: #2c4156; }
                .installment-table td:first-child { font-weight: 600; }
                .installment-table td:last-child { font-weight: 700; text-align: right; }
                .footer { background: linear-gradient(90deg, #1e3a5f 0%, #2d4a6f 100%); color: white; padding: 12px 25px; font-size: 8px; flex-shrink: 0; }
                .footer-content { display: grid; grid-template-columns: 35% 1fr; gap: 15px; }
                .signature-line { border-top: 2px solid white; margin-top: 20px; width: 90%; }
                .signature-label { margin-top: 8px; }
                .footer-text { margin-bottom: 6px; }
                .footer-disclaimer { font-size: 8px; margin-top: 4px; opacity: 0.9; }
                .pj-note { font-size: 7px; color: #555; margin-top: 8px; line-height: 1.4; font-style: italic; }
                .footer-pj { display: flex; flex-direction: column; gap: 6px; }
                @keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
                @media print {
                    @page { size: A4; margin: 0; }
                    .pdf-container { box-shadow: none; }
                }
            `}</style>

            <div id="loadingOverlay" style={{
                position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.9)',
                display: 'flex', flexDirection: 'column',
                justifyContent: 'center', alignItems: 'center', zIndex: 9999,
            }}>
                <div style={{
                    width: 50, height: 50, border: '5px solid #f3f3f3',
                    borderTop: '5px solid #2c4156', borderRadius: '50%',
                    animation: 'spin 1s linear infinite', marginBottom: 20,
                }} />
                <div style={{ color: '#2c4156', fontSize: 16, fontWeight: 500 }}>Gerando PDF...</div>
            </div>

            {pdfReady && (
                <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 1000, display: 'flex', gap: 8 }}>
                    <button
                        onClick={() => { pdfTriggered.current = false; window.location.reload() }}
                        style={{ background: '#1e3a5f', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}
                    >
                        ⬇️ Tentar novamente
                    </button>
                    <button
                        onClick={() => window.print()}
                        style={{ background: '#c9a961', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}
                    >
                        🖨️ Imprimir
                    </button>
                </div>
            )}

            <div className="pdf-container">
                <header className="header">
                    <div className="brand">
                        <h1>MEO</h1>
                        <div className="tagline">Leasing</div>
                    </div>
                    <div className="header-right">
                        <div className="main-title">Proposta de Leasing Solar</div>
                        <div className="subtitle">{clientTypeLabel} • {currentDate}</div>
                    </div>
                </header>

                <div className="content">
                    <section className="section">
                        <h2 className="section-title">Dados do Cliente</h2>
                        <div className="client-grid">
                            <div className="client-field">
                                <div className="field-label">Nome</div>
                                <div className="field-value">{name}</div>
                            </div>
                            <div className="client-field">
                                <div className="field-label">E-mail</div>
                                <div className="field-value">{email}</div>
                            </div>
                            <div className="client-field">
                                <div className="field-label">WhatsApp</div>
                                <div className="field-value">{whatsapp}</div>
                            </div>
                            <div className="client-field">
                                <div className="field-label">Data Emissão</div>
                                <div className="field-value">{currentDate}</div>
                            </div>
                        </div>
                    </section>

                    <section className="section">
                        <h2 className="section-title">Resumo Financeiro</h2>
                        <div className="finance-grid">
                            <div className="client-field">
                                <div className="field-label">Investimento</div>
                                <div className="field-value">{formatCurrency(investmentValue)}</div>
                            </div>
                            <div className="client-field">
                                <div className="field-label">Taxa de Gestão ({managementFeePercent}%)</div>
                                <div className="field-value">{formatCurrency(managementFeeValue)}</div>
                            </div>
                            <div className="client-field">
                                <div className="field-label">Taxa de Contratação ({serviceFeePercent}%)</div>
                                <div className="field-value">{formatCurrency(serviceFeeValue)}</div>
                            </div>
                        </div>
                        <div className="total-card">
                            <div className="total-label">Investimento Total</div>
                            <div className="total-amount">{formatCurrency(totalInvestment)}</div>
                        </div>
                    </section>

                    <section className="section">
                        <h2 className="section-title">Opções de Parcelamento</h2>
                        {clientType === 'pj' ? (
                            <>
                                <table className="installment-table">
                                    <thead>
                                        <tr>
                                            <th style={{ textAlign: 'center' }}>Prazo</th>
                                            <th style={{ textAlign: 'center' }}>Valor da Parcela</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {calculations.map((calc) => (
                                            <tr key={calc.month}>
                                                <td style={{ textAlign: 'center' }}>{calc.month} meses</td>
                                                <td style={{ textAlign: 'center', fontWeight: 700 }}>{formatCurrency(calc.installment)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <p className="pj-note">* A tarifa de gestão corresponde ao serviço de Homologação, Gestão e acompanhamento da execução da instalação do projeto e, durante o período do contrato, ao monitoramento 24/7 da usina com geração de aviso de ocorrências, assim como o envio de Relatórios mensais ou trimestrais da performance da usina a disponibilizar ao cliente.</p>
                            </>
                        ) : (
                            <table className="installment-table">
                                <thead>
                                    <tr>
                                        <th>Prazo</th>
                                        <th>Taxa Mensal</th>
                                        <th style={{ textAlign: 'right' }}>Valor da Parcela</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {calculations.map((calc) => (
                                        <tr key={calc.month}>
                                            <td>{calc.month} meses</td>
                                            <td>{calc.ratePercent.toFixed(2)}%</td>
                                            <td style={{ textAlign: 'right' }}>{formatCurrency(calc.installment)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </section>
                </div>

                <footer className="footer">
                    {clientType === 'pj' ? (
                        <div className="footer-pj">
                            <div className="footer-text">
                                <strong>Esta proposta é válida por 30 dias.</strong> Os valores são simulações e podem sofrer alterações conforme análise de crédito.
                            </div>
                            <div className="footer-disclaimer">
                                A MEO atua exclusivamente como correspondente/intermediária de crédito, não sendo instituição financeira, nos termos da regulamentação do Banco Central do Brasil, e não realiza concessão direta de crédito.
                            </div>
                        </div>
                    ) : (
                        <div className="footer-content">
                            <div className="footer-left">
                                <hr className="signature-line" />
                                <div className="signature-label">Assinatura do Cliente</div>
                            </div>
                            <div className="footer-right">
                                <div className="footer-text">
                                    <strong>Esta proposta é válida por 30 dias.</strong> Os valores são simulações e podem sofrer alterações conforme análise de crédito.
                                </div>
                                <div className="footer-disclaimer">
                                    A MEO atua exclusivamente como correspondente/intermediária de crédito, não sendo instituição financeira, nos termos da regulamentação do Banco Central do Brasil, e não realiza concessão direta de crédito.
                                </div>
                            </div>
                        </div>
                    )}
                </footer>
            </div>
        </>
    )
}

// ✅ Página exportada com Suspense
export default function SimulacaoResultadoPage() {
    return (
        <Suspense fallback={
            <>
                <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.95)',
                    display: 'flex', flexDirection: 'column', justifyContent: 'center',
                    alignItems: 'center', fontFamily: 'sans-serif',
                }}>
                    <div style={{
                        width: 50, height: 50, border: '5px solid #f3f3f3',
                        borderTop: '5px solid #2c4156', borderRadius: '50%',
                        animation: 'spin 1s linear infinite', marginBottom: 20,
                    }} />
                    <div style={{ color: '#2c4156', fontSize: 16, fontWeight: 500 }}>
                        Preparando proposta...
                    </div>
                </div>
            </>
        }>
            <SimulacaoResultadoContent />
        </Suspense>
    )
}
