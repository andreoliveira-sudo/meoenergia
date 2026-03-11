import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from "@/actions/auth"
import { getOrderById } from '@/actions/orders'
import { getPfRates, getPjRates } from '@/actions/rates'
import { formatCurrencyNew, formatPhone } from '@/lib/formatters'
import { calculateInstallmentPayment } from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user.id) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    const { orderId: id } = await params
    if (!id) {
      return NextResponse.json({ error: 'ID do pedido não fornecido' }, { status: 400 })
    }

    const orderResponse = await getOrderById(id)
    if (!orderResponse.success || !orderResponse.data) {
      return NextResponse.json(
        { error: orderResponse.message || 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    const order = orderResponse.data
    const customer = order.customer

    if (!customer || !['pf', 'pj'].includes(customer.type)) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 400 })
    }

    const isPj = customer.type === 'pj'

    const ratesResponse = isPj ? await getPjRates() : await getPfRates()
    if (!ratesResponse.success || !ratesResponse.data) {
      return NextResponse.json(
        { error: ratesResponse.message || 'Taxas não encontradas' },
        { status: 404 }
      )
    }

    const rates = ratesResponse.data

    // Valores base do pedido
    const equipmentValue = order.equipment_value || 0
    const laborValue = order.labor_value || 0
    const otherCosts = order.other_costs || 0
    const investmentValue = equipmentValue + laborValue + otherCosts

    // Taxas (com fallbacks)
    const managementFeePercent = isPj
      ? (rates.pj_management_fee || 4)
      : (rates.pf_management_fee || 8)

    const serviceFeePercent = isPj
      ? (rates.pj_service_fee || 8)
      : (rates.pf_service_fee || 8)

    // Cálculo igual para PF e PJ
    const managementFeeValue = investmentValue * (managementFeePercent / 100)
    const serviceFeeValue = (investmentValue + managementFeeValue) * (serviceFeePercent / 100)
    const totalInvestment = investmentValue + managementFeeValue + serviceFeeValue

    // Parcelas
    let calculations: { month: number; ratePercent: number; installment: number }[]

    if (isPj) {
      const pjMonths = [24, 36, 48, 60]
      const monthlyRates: Record<number, number> = {
        24: rates.pj_interest_rate_24 || 2.5,
        36: rates.pj_interest_rate_36 || 2.5,
        48: rates.pj_interest_rate_48 || 2.5,
        60: rates.pj_interest_rate_60 || 2.5,
      }

      calculations = pjMonths.map(month => {
        const rate = (monthlyRates[month] || 2.5) / 100
        const installment = calculateInstallmentPayment({
          numberOfPeriods: month,
          presentValue: totalInvestment,
          rate,
        })
        return { month, ratePercent: monthlyRates[month] || 2.5, installment }
      })
    } else {
      const pfMonths = [24, 30, 36, 48, 60, 72, 84, 96]
      const monthlyRates: Record<number, number> = {
        24: rates.pf_interest_rate_24 || 1.49,
        30: rates.pf_interest_rate_30 || 1.49,
        36: rates.pf_interest_rate_36 || 1.60,
        48: rates.pf_interest_rate_48 || 1.64,
        60: rates.pf_interest_rate_60 || 1.68,
        72: rates.pf_interest_rate_72 || 1.72,
        84: rates.pf_interest_rate_84 || 1.76,
        96: rates.pf_interest_rate_96 || 1.80,
      }

      calculations = pfMonths.map(month => {
        const rate = (monthlyRates[month] || 1.5) / 100
        const installment = calculateInstallmentPayment({
          numberOfPeriods: month,
          presentValue: totalInvestment,
          rate,
        })
        return { month, ratePercent: monthlyRates[month] || 1.5, installment }
      })
    }

    const htmlContent = generateHTMLWithInlineCSS({
      customer,
      calculations,
      investmentValue,
      managementFeeValue,
      serviceFeeValue,   // ✅ variável correta, não recalculada
      totalInvestment,
      managementFeePercent,
      serviceFeePercent,
      financingTerm: order.financing_term,
      clientType: isPj ? 'pj' : 'pf',
    })

    return new NextResponse(htmlContent, {
      headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-cache, no-store, must-revalidate' }
    })

  } catch (error) {
    console.error('Erro ao gerar HTML da proposta:', error)
    return NextResponse.json({ error: 'Erro interno ao gerar proposta' }, { status: 500 })
  }
}

// ─── HTML Generator ───────────────────────────────────────────────────────────
function generateHTMLWithInlineCSS(data: {
  customer: any
  calculations: { month: number; ratePercent: number; installment: number }[]
  investmentValue: number
  managementFeeValue: number
  serviceFeeValue: number
  totalInvestment: number
  managementFeePercent: number
  serviceFeePercent: number
  financingTerm?: number
  clientType: 'pf' | 'pj'
}) {
  const {
    customer, calculations, investmentValue, managementFeeValue,
    serviceFeeValue, totalInvestment, managementFeePercent,
    serviceFeePercent, financingTerm, clientType,
  } = data

  const isPj = clientType === 'pj'
  const clientTypeLabel = isPj ? 'Empresas / Condomínio' : 'Pessoa Física'
  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric'
  })

  const tableHTML = isPj
    ? `<table class="installment-table">
        <thead>
          <tr>
            <th style="text-align:center;">Prazo</th>
            <th style="text-align:center;">Valor da Parcela</th>
          </tr>
        </thead>
        <tbody>
          ${calculations.map(calc => `
            <tr${calc.month === financingTerm ? ' class="highlighted"' : ''}>
              <td style="text-align:center;">${calc.month} meses</td>
              <td style="text-align:center; font-weight:700;">${formatCurrencyNew(calc.installment)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <p class="pj-note">* A tarifa de gestão corresponde ao serviço de Homologação, Gestão e acompanhamento da execução da instalação do projeto e, durante o período do contrato, ao monitoramento 24/7 da usina com geração de aviso de ocorrências, assim como o envio de Relatórios mensais ou trimestrais da performance da usina a disponibilizar ao cliente.</p>`
    : `<table class="installment-table">
        <thead>
          <tr>
            <th>Prazo</th>
            <th>Taxa Mensal</th>
            <th style="text-align:right;">Valor da Parcela</th>
          </tr>
        </thead>
        <tbody>
          ${calculations.map(calc => `
            <tr${calc.month === financingTerm ? ' class="highlighted"' : ''}>
              <td>${calc.month} meses</td>
              <td>${calc.ratePercent.toFixed(2)}%</td>
              <td style="text-align:right;">${formatCurrencyNew(calc.installment)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>`

  const footerHTML = isPj
    ? `<div class="footer-pj">
        <div class="footer-text">
          <strong>Esta proposta é válida por 30 dias.</strong> Os valores são simulações e podem sofrer alterações conforme análise de crédito.
        </div>
        <div class="footer-disclaimer">
          A MEO atua exclusivamente como correspondente/intermediária de crédito, não sendo instituição financeira, nos termos da regulamentação do Banco Central do Brasil, e não realiza concessão direta de crédito.
        </div>
      </div>`
    : `<div class="footer-content">
        <div class="footer-left">
          <hr class="signature-line">
          <div class="signature-label">Assinatura do Cliente</div>
        </div>
        <div class="footer-right">
          <div class="footer-text">
            <strong>Esta proposta é válida por 30 dias.</strong> Os valores são simulações e podem sofrer alterações conforme análise de crédito.
          </div>
          <div class="footer-disclaimer">
            A MEO atua exclusivamente como correspondente/intermediária de crédito, não sendo instituição financeira, nos termos da regulamentação do Banco Central do Brasil, e não realiza concessão direta de crédito.
          </div>
        </div>
      </div>`

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Proposta de Leasing Solar - MEO Leasing</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', 'Segoe UI', 'Helvetica', 'Arial', sans-serif;
            color: #2c4156; line-height: 1.6; background: #ffffff;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        .pdf-container {
            width: 210mm; min-height: 297mm; margin: 0 auto; background: white;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            display: flex; flex-direction: column; justify-content: space-between;
        }
        .header {
            background: linear-gradient(90deg, #1e3a5f 0%, #2d4a6f 100%);
            color: white; padding: 12px 25px;
            display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;
        }
        .brand h1 { font-size: 28px; font-weight: 700; letter-spacing: 4px; margin: 0; line-height: 1; text-align: center; }
        .brand .tagline { font-size: 9px; font-weight: 300; letter-spacing: 2.5px; text-align: center; }
        .header-right { text-align: right; }
        .main-title { font-size: 16px; font-weight: 600; margin: 0; line-height: 1.2; }
        .subtitle { font-size: 10px; font-weight: 300; opacity: 0.9; }
        .content { padding: 12px 25px; flex: 1; }
        .section { margin-bottom: 10px; }
        .section-title { font-size: 12px; font-weight: 700; color: #2c4156; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 2px solid #d3a22e; }
        .client-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
        .client-field { display: flex; flex-direction: column; background: #f4f4f4; border-radius: 4px; padding: 4px; }
        .field-label { font-size: 8px; color: #42494f; text-transform: uppercase; letter-spacing: 0.4px; font-weight: 500; }
        .field-value { font-size: 10px; color: #2d4a6f; font-weight: 600; }
        .finance-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .total-card { background: linear-gradient(90deg, #1e3a5f 0%, #2d4a6f 100%); border-radius: 6px; padding: 12px; margin-top: 12px; text-align: center; }
        .total-label { font-size: 8px; color: white; font-weight: 400; text-transform: uppercase; }
        .total-amount { font-size: 14px; color: #d3a22e; font-weight: 800; letter-spacing: 1.5px; }
        .installment-table { width: 100%; border-collapse: collapse; background: white; margin-top: 8px; }
        .installment-table thead { background: linear-gradient(90deg, #1e3a5f 0%, #2d4a6f 100%); color: white; }
        .installment-table th { padding: 6px 8px; text-align: left; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; }
        .installment-table tbody tr { border-bottom: 1px solid #e9ecef; }
        .installment-table tbody tr:nth-child(even) { background: #fafbfc; }
        .installment-table tbody tr.highlighted { background: #fff3cd !important; border-left: 4px solid #d3a22e; }
        .installment-table tbody tr.highlighted td { color: #2c4156; font-weight: 700; }
        .installment-table td { padding: 6px 8px; font-size: 9px; color: #2c4156; }
        .installment-table td:first-child { font-weight: 600; }
        .installment-table td:last-child { font-weight: 700; text-align: right; }
        .pj-note { font-size: 7px; color: #555; margin-top: 8px; line-height: 1.4; font-style: italic; }
        .footer { background: linear-gradient(90deg, #1e3a5f 0%, #2d4a6f 100%); color: white; padding: 12px 25px; font-size: 8px; line-height: 1.3; flex-shrink: 0; }
        .footer-content { display: grid; grid-template-columns: 35% 1fr; gap: 15px; align-items: start; }
        .footer-left { display: flex; flex-direction: column; }
        .footer-right { display: flex; flex-direction: column; }
        .footer-pj { display: flex; flex-direction: column; gap: 6px; }
        .signature-label { font-weight: 500; margin-top: 8px; }
        .signature-line { border: none; border-top: 2px solid white; margin-top: 20px; width: 90%; }
        .footer-text { font-weight: 300; margin-bottom: 6px; }
        .footer-disclaimer { font-weight: 300; font-size: 8px; margin-top: 4px; opacity: 0.9; }
        .loading-overlay { position: fixed; inset: 0; background: rgba(255,255,255,0.9); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 9999; }
        .spinner { width: 50px; height: 50px; border: 5px solid #f3f3f3; border-top: 5px solid #2c4156; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 20px; }
        .loading-text { color: #2c4156; font-size: 16px; font-weight: 500; }
        @keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        @media print {
            @page { size: A4; margin: 0; }
            .pdf-container { box-shadow: none; min-height: 297mm; }
        }
    </style>
</head>
<body>
    <div id="loadingOverlay" class="loading-overlay" style="display:none;">
        <div class="spinner"></div>
        <div class="loading-text">Gerando PDF...</div>
    </div>

    <div class="pdf-container">
        <header class="header">
            <div class="brand">
                <h1>MEO</h1>
                <div class="tagline">Leasing</div>
            </div>
            <div class="header-right">
                <div class="main-title">Proposta de Leasing Solar</div>
                <div class="subtitle">${clientTypeLabel} • ${currentDate}</div>
            </div>
        </header>

        <div class="content">
            <section class="section">
                <h2 class="section-title">Dados do Cliente</h2>
                <div class="client-grid">
                    <div class="client-field">
                        <div class="field-label">Nome</div>
                        <div class="field-value">${customer.name || customer.company_name}</div>
                    </div>
                    <div class="client-field">
                        <div class="field-label">E-mail</div>
                        <div class="field-value">${customer.contact_email || ''}</div>
                    </div>
                    <div class="client-field">
                        <div class="field-label">WhatsApp</div>
                        <div class="field-value">${formatPhone(customer.contact_phone) || ''}</div>
                    </div>
                    <div class="client-field">
                        <div class="field-label">Data Emissão</div>
                        <div class="field-value">${currentDate}</div>
                    </div>
                </div>
            </section>

            <section class="section">
                <h2 class="section-title">Resumo Financeiro</h2>
                <div class="finance-grid">
                    <div class="client-field">
                        <div class="field-label">Investimento</div>
                        <div class="field-value">${formatCurrencyNew(investmentValue)}</div>
                    </div>
                    <div class="client-field">
                        <div class="field-label">Taxa de Gestão (${managementFeePercent}%)</div>
                        <div class="field-value">${formatCurrencyNew(managementFeeValue)}</div>
                    </div>
                    <div class="client-field">
                        <div class="field-label">Taxa de Contratação (${serviceFeePercent}%)</div>
                        <div class="field-value">${formatCurrencyNew(serviceFeeValue)}</div>
                    </div>
                </div>
                <div class="total-card">
                    <div class="total-label">Investimento Total</div>
                    <div class="total-amount">${formatCurrencyNew(totalInvestment)}</div>
                </div>
            </section>

            <section class="section">
                <h2 class="section-title">Opções de Parcelamento</h2>
                ${tableHTML}
            </section>
        </div>

        <footer class="footer">
            ${footerHTML}
        </footer>
    </div>

    <script src="https://html2canvas.hertzen.com/dist/html2canvas.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script>
        window.jspdf = window.jspdf || { jsPDF: window.jsPDF };

        function generateAndDownloadPDF() {
            const overlay = document.getElementById('loadingOverlay');
            overlay.style.display = 'flex';

            if (typeof html2canvas === 'undefined' || typeof jspdf === 'undefined') {
                alert('Bibliotecas não carregadas.');
                overlay.style.display = 'none';
                return;
            }

            setTimeout(() => {
                try {
                    html2canvas(document.querySelector('.pdf-container'), {
                        scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff',
                        onclone: (clonedDoc) => {
                            const ov = clonedDoc.getElementById('loadingOverlay');
                            if (ov) ov.style.display = 'none';
                        }
                    }).then(canvas => {
                        const pdf = new jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
                        const imgWidth = 210;
                        const imgHeight = (canvas.height * imgWidth) / canvas.width;
                        pdf.addImage(canvas.toDataURL('image/png', 1.0), 'PNG', 0, 0, imgWidth, imgHeight);
                        pdf.save('proposta-leasing-meo.pdf');
                        overlay.style.display = 'none';
                        if (window.opener) setTimeout(() => window.close(), 1000);
                    }).catch(() => {
                        overlay.style.display = 'none';
                        alert('Erro ao gerar PDF. Use Ctrl+P para imprimir.');
                    });
                } catch (e) {
                    overlay.style.display = 'none';
                    alert('Erro ao gerar PDF. Use Ctrl+P para imprimir.');
                }
            }, 500);
        }

        document.addEventListener('DOMContentLoaded', () => setTimeout(generateAndDownloadPDF, 1000));
    </script>
</body>
</html>`
}