"use server"

import fontkit from "@pdf-lib/fontkit"
import { PDFDocument, type PDFFont, rgb } from "pdf-lib"

import { getOrderById } from "@/actions/orders"
import { MONTSERRAT_BASE64 } from "@/lib/constants"
import { formatCnpj, formatCpf, formatCurrency } from "@/lib/formatters"
import { calculateInstallmentPayment } from "@/lib/utils"
import type { ActionResponse } from "@/types/action-response"

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

function centerTextAtX({ text, font, fontSize, centerX }: { text: string; font: PDFFont; fontSize: number; centerX: number }): number {
	const textWidth = font.widthOfTextAtSize(text, fontSize)
	return centerX - textWidth / 2
}

function formatLongDate(date: Date): string {
	const opts: Intl.DateTimeFormatOptions = { timeZone: 'America/Sao_Paulo' }
	const day = date.toLocaleDateString('pt-BR', { ...opts, day: '2-digit' }).slice(0, 2)
	const month = date.toLocaleDateString('pt-BR', { ...opts, month: 'long' })
	const year = date.toLocaleDateString('pt-BR', { ...opts, year: 'numeric' }).slice(-4)
	return `${day} de ${month} de ${year}`
}

// ========================================
// FUNÇÃO PARA PJ (MANTIDA ORIGINAL)
// ========================================

export async function generatePJOrderPdf(orderId: string): Promise<ActionResponse<{ pdfBase64: string }>> {
	if (!orderId) {
		return { success: false, message: "ID do pedido não fornecido." }
	}

	try {
		// 1. Buscar os dados do pedido e do cliente
		const orderDetails = await getOrderById(orderId)
		if (!orderDetails.success || !orderDetails.data) {
			return { success: false, message: orderDetails.message || "Não foi possível encontrar o pedido." }
		}

		const {
			customer,
			equipment_value,
			labor_value,
			other_costs,
			service_fee_36,
			service_fee_48,
			service_fee_60,
			interest_rate_36,
			interest_rate_48,
			interest_rate_60
		} = orderDetails.data

		// 2. Carregar template
		const templateModule = await import('@/lib/constants/template-simulation-base64')
		const base64Template = templateModule.default

		const templateBytes = Buffer.from(base64Template, "base64")
		const montserratFontBytes = Buffer.from(MONTSERRAT_BASE64, "base64")

		const pdfDoc = await PDFDocument.load(templateBytes)
		pdfDoc.registerFontkit(fontkit)
		const montserratFont = await pdfDoc.embedFont(montserratFontBytes, { subset: true })
		
		const textColor = rgb(83 / 255, 86 / 255, 90 / 255)
		const fontSize = 8
		const firstPage = pdfDoc.getPages()[0]
		const { height } = firstPage.getSize()
		const leftAlign = 133

		// ========================================
		// BLOCO DE PREPARAÇÃO
		// ========================================

		const formattedCnpj = formatCnpj(customer.cnpj)
		const companyName = customer.company_name
		const currentDate = formatLongDate(new Date())
		const requestedValue = (equipment_value || 0) + (labor_value || 0) + (other_costs || 0)
		const formattedRequestedValue = formatCurrency(requestedValue)

		const serviceFee = {
			36: service_fee_36 / 100,
			48: service_fee_48 / 100,
			60: service_fee_60 / 100
		}

		const totalServices = {
			36: requestedValue * serviceFee[36],
			48: requestedValue * serviceFee[48],
			60: requestedValue * serviceFee[60]
		}

		const installmentsRates = {
			36: interest_rate_36 / 100,
			48: interest_rate_48 / 100,
			60: interest_rate_60 / 100
		}

		const installments = {
			36: calculateInstallmentPayment({ numberOfPeriods: 36, presentValue: totalServices["36"] + requestedValue, rate: installmentsRates["36"] }),
			48: calculateInstallmentPayment({ numberOfPeriods: 48, presentValue: totalServices["48"] + requestedValue, rate: installmentsRates["48"] }),
			60: calculateInstallmentPayment({ numberOfPeriods: 60, presentValue: totalServices["60"] + requestedValue, rate: installmentsRates["60"] })
		}

		// ========================================
		// BLOCO DE DESENHO
		// ========================================

		// Data Atual
		firstPage.drawText(currentDate, {
			x: 511,
			y: height - 74,
			size: fontSize,
			color: textColor,
			font: montserratFont
		})

		// Razão Social
		firstPage.drawText(companyName, {
			x: leftAlign,
			y: height - 130,
			size: fontSize,
			color: textColor,
			font: montserratFont
		})

		// CNPJ
		firstPage.drawText(formattedCnpj, {
			x: leftAlign,
			y: height - 148,
			size: fontSize,
			color: textColor,
			font: montserratFont
		})

		// Valor Solicitado (Header)
		firstPage.drawText(formattedRequestedValue, {
			x: leftAlign,
			y: height - 184,
			size: fontSize,
			color: textColor,
			font: montserratFont
		})

		// Valor Solicitado (Tabela)
		const requestedValueX = 228
		const totalServicesX = 324
		const amountFinancedX = 430
		const installmentsX = 524

		// Linha 36 meses
		firstPage.drawText(formattedRequestedValue, {
			x: centerTextAtX({ text: formattedRequestedValue, font: montserratFont, fontSize: fontSize, centerX: requestedValueX }),
			y: height - 487,
			size: fontSize,
			color: textColor,
			font: montserratFont
		})
		firstPage.drawText(formatCurrency(totalServices["36"]), {
			x: centerTextAtX({ text: formatCurrency(totalServices["36"]), font: montserratFont, fontSize: fontSize, centerX: totalServicesX }),
			y: height - 487,
			size: fontSize,
			color: textColor,
			font: montserratFont
		})
		firstPage.drawText(formatCurrency(totalServices["36"] + requestedValue), {
			x: centerTextAtX({ text: formatCurrency(totalServices["36"] + requestedValue), font: montserratFont, fontSize: fontSize, centerX: amountFinancedX }),
			y: height - 487,
			size: fontSize,
			color: textColor,
			font: montserratFont
		})
		firstPage.drawText(formatCurrency(installments["36"]), {
			x: centerTextAtX({ text: formatCurrency(installments["36"]), font: montserratFont, fontSize: fontSize, centerX: installmentsX }),
			y: height - 487,
			size: fontSize,
			color: textColor,
			font: montserratFont
		})

		// Linha 48 meses
		firstPage.drawText(formattedRequestedValue, {
			x: centerTextAtX({ text: formattedRequestedValue, font: montserratFont, fontSize: fontSize, centerX: requestedValueX }),
			y: height - 507,
			size: fontSize,
			color: textColor,
			font: montserratFont
		})
		firstPage.drawText(formatCurrency(totalServices["48"]), {
			x: centerTextAtX({ text: formatCurrency(totalServices["48"]), font: montserratFont, fontSize: fontSize, centerX: totalServicesX }),
			y: height - 507,
			size: fontSize,
			color: textColor,
			font: montserratFont
		})
		firstPage.drawText(formatCurrency(totalServices["48"] + requestedValue), {
			x: centerTextAtX({ text: formatCurrency(totalServices["48"] + requestedValue), font: montserratFont, fontSize: fontSize, centerX: amountFinancedX }),
			y: height - 507,
			size: fontSize,
			color: textColor,
			font: montserratFont
		})
		firstPage.drawText(formatCurrency(installments["48"]), {
			x: centerTextAtX({ text: formatCurrency(installments["48"]), font: montserratFont, fontSize: fontSize, centerX: installmentsX }),
			y: height - 507,
			size: fontSize,
			color: textColor,
			font: montserratFont
		})

		// Linha 60 meses
		firstPage.drawText(formattedRequestedValue, {
			x: centerTextAtX({ text: formattedRequestedValue, font: montserratFont, fontSize: fontSize, centerX: requestedValueX }),
			y: height - 527,
			size: fontSize,
			color: textColor,
			font: montserratFont
		})
		firstPage.drawText(formatCurrency(totalServices["60"]), {
			x: centerTextAtX({ text: formatCurrency(totalServices["60"]), font: montserratFont, fontSize: fontSize, centerX: totalServicesX }),
			y: height - 527,
			size: fontSize,
			color: textColor,
			font: montserratFont
		})
		firstPage.drawText(formatCurrency(totalServices["60"] + requestedValue), {
			x: centerTextAtX({ text: formatCurrency(totalServices["60"] + requestedValue), font: montserratFont, fontSize: fontSize, centerX: amountFinancedX }),
			y: height - 527,
			size: fontSize,
			color: textColor,
			font: montserratFont
		})
		firstPage.drawText(formatCurrency(installments["60"]), {
			x: centerTextAtX({ text: formatCurrency(installments["60"]), font: montserratFont, fontSize: fontSize, centerX: installmentsX }),
			y: height - 527,
			size: fontSize,
			color: textColor,
			font: montserratFont
		})

		// 3. Salvar PDF
		const pdfBytes = await pdfDoc.save()
		const pdfBase64 = Buffer.from(pdfBytes).toString("base64")

		return {
			success: true,
			message: "PDF PJ gerado com sucesso.",
			data: { pdfBase64 }
		}
	} catch (error) {
		console.error("Erro ao gerar PDF PJ:", error)
		return {
			success: false,
			message: `Erro ao gerar PDF: ${error instanceof Error ? error.message : "Erro desconhecido"}`
		}
	}
}

// ========================================
// FUNÇÃO PARA PF (SEGUINDO O MODELO DO final.pdf)
// ========================================

export async function generatePFOrderPdf(orderId: string): Promise<ActionResponse<{ pdfBase64: string }>> {
	if (!orderId) {
		return { success: false, message: "ID do pedido não fornecido." }
	}

	try {
		const orderResponse = await getOrderById(orderId)
		if (!orderResponse.success || !orderResponse.data) {
			return { success: false, message: orderResponse.message || "Pedido não encontrado" }
		}

		const order = orderResponse.data
		const customer = order.customer
		
		if (!customer || customer.type !== 'pf') {
			return { success: false, message: "Cliente PF não encontrado" }
		}

		// 1. Criar PDF
		const pdfDoc = await PDFDocument.create()
		pdfDoc.registerFontkit(fontkit)
		
		const montserratFontBytes = Buffer.from(MONTSERRAT_BASE64, "base64")
		const montserratFont = await pdfDoc.embedFont(montserratFontBytes, { subset: true })
		
		const page = pdfDoc.addPage([595.28, 841.89]) // A4
		const { width, height } = page.getSize()
		
		// Cores do design elegante (tom sobre tom, limpo)
		const primaryColor = rgb(0, 0, 0) // Preto suave para elegância
		const secondaryColor = rgb(100 / 255, 100 / 255, 100 / 255) // Cinza médio
		const lightGray = rgb(200 / 255, 200 / 255, 200 / 255) // Cinza claro
		const accentColor = rgb(0, 0, 0) // Preto para destaques
		const backgroundColor = rgb(1, 1, 1) // Branco puro
		
		// ========== FUNDO BRANCO ==========
		page.drawRectangle({
			x: 0, y: 0, width, height,
			color: backgroundColor
		})
		
		// ========== HEADER ELEGANTE ==========
		const headerY = height - 60
		
		// Logo MEO (estilo minimalista)
		page.drawText("MEO", {
			x: 50, y: headerY, size: 24, color: primaryColor, font: montserratFont
		})
		
		page.drawText("Leasing", {
			x: 50, y: headerY - 25, size: 14, color: secondaryColor, font: montserratFont
		})
		
		// Linha divisória sutil
		page.drawLine({
			start: { x: 50, y: headerY - 35 },
			end: { x: width - 50, y: headerY - 35 },
			thickness: 0.5,
			color: lightGray
		})
		
		// Data à direita (estilo minimalista)
		const currentDate = formatLongDate(new Date())
		page.drawText("Pessoa Física · " + currentDate, {
			x: width - 220, y: headerY - 10, size: 10, color: secondaryColor, font: montserratFont
		})
		
		// ========== TÍTULO PRINCIPAL ==========
		const titleY = headerY - 80
		page.drawText("Proposta de Leasing Solar", {
			x: 50, y: titleY, size: 20, color: primaryColor, font: montserratFont
		})
		
		// ========== SEÇÃO: DADOS DO CLIENTE ==========
		const clientSectionY = titleY - 60
		
		// Título da seção
		page.drawText("Dados do Cliente", {
			x: 50, y: clientSectionY, size: 16, color: primaryColor, font: montserratFont
		})
		
		// Linha sutil abaixo do título
		page.drawLine({
			start: { x: 50, y: clientSectionY - 10 },
			end: { x: 200, y: clientSectionY - 10 },
			thickness: 1,
			color: accentColor
		})
		
		// Layout em duas colunas elegante
		const leftColumnX = 50
		const rightColumnX = width / 2
		const rowSpacing = 28
		let currentRow = 0
		
		// NOME (primeira linha)
		page.drawText("NOME", { 
			x: leftColumnX, 
			y: clientSectionY - 40 - (currentRow * rowSpacing), 
			size: 11, 
			color: secondaryColor, 
			font: montserratFont 
		})
		page.drawText(customer.name || '', { 
			x: leftColumnX + 80, 
			y: clientSectionY - 40 - (currentRow * rowSpacing), 
			size: 12, 
			color: primaryColor, 
			font: montserratFont 
		})
		currentRow++
		
		// E-MAIL
		page.drawText("E-MAIL", { 
			x: leftColumnX, 
			y: clientSectionY - 40 - (currentRow * rowSpacing), 
			size: 11, 
			color: secondaryColor, 
			font: montserratFont 
		})
		page.drawText(customer.contact_email || '', { 
			x: leftColumnX + 80, 
			y: clientSectionY - 40 - (currentRow * rowSpacing), 
			size: 12, 
			color: primaryColor, 
			font: montserratFont 
		})
		currentRow++
		
		// WHATSAPP
		page.drawText("WHATSAPP", { 
			x: leftColumnX, 
			y: clientSectionY - 40 - (currentRow * rowSpacing), 
			size: 11, 
			color: secondaryColor, 
			font: montserratFont 
		})
		page.drawText(customer.contact_phone || '', { 
			x: leftColumnX + 80, 
			y: clientSectionY - 40 - (currentRow * rowSpacing), 
			size: 12, 
			color: primaryColor, 
			font: montserratFont 
		})
		currentRow++
		
		// CPF (se existir)
		if (customer.cpf) {
			page.drawText("CPF", { 
				x: leftColumnX, 
				y: clientSectionY - 40 - (currentRow * rowSpacing), 
				size: 11, 
				color: secondaryColor, 
				font: montserratFont 
			})
			page.drawText(formatCpf(customer.cpf), { 
				x: leftColumnX + 80, 
				y: clientSectionY - 40 - (currentRow * rowSpacing), 
				size: 12, 
				color: primaryColor, 
				font: montserratFont 
			})
			currentRow++
		}
		
		// Espaçamento entre seções
		const financeSectionY = clientSectionY - 40 - (currentRow * rowSpacing) - 40
		
		// ========== SEÇÃO: RESUMO FINANCEIRO ==========
		
		// Título da seção
		page.drawText("Resumo Financeiro", {
			x: 50, y: financeSectionY, size: 16, color: primaryColor, font: montserratFont
		})
		
		// Linha sutil abaixo do título
		page.drawLine({
			start: { x: 50, y: financeSectionY - 10 },
			end: { x: 200, y: financeSectionY - 10 },
			thickness: 1,
			color: accentColor
		})
		
		// Valores
		const equipmentValue = order.equipment_value || 0
		const laborValue = order.labor_value || 0
		const otherCosts = order.other_costs || 0
		const investmentValue = equipmentValue + laborValue + otherCosts
		
		const managementFeePercent = 8
		const managementFeeValue = investmentValue * (managementFeePercent / 100)
		
		const serviceFeePercent = 8
		const serviceFeeValue = investmentValue * (serviceFeePercent / 100)
		
		const totalInvestment = investmentValue + managementFeeValue + serviceFeeValue
		
		// Layout em duas colunas
		const financeLeftX = 50
		const financeRightX = width - 200
		currentRow = 0
		
		// INVESTIMENTO
		page.drawText("INVESTIMENTO", { 
			x: financeLeftX, 
			y: financeSectionY - 40 - (currentRow * 25), 
			size: 12, 
			color: secondaryColor, 
			font: montserratFont 
		})
		page.drawText(formatCurrency(investmentValue), { 
			x: financeRightX, 
			y: financeSectionY - 40 - (currentRow * 25), 
			size: 12, 
			color: primaryColor, 
			font: montserratFont 
		})
		currentRow++
		
		// TAXA GESTÃO
		page.drawText(`TAXA GESTÃO (${managementFeePercent}%)`, { 
			x: financeLeftX, 
			y: financeSectionY - 40 - (currentRow * 25), 
			size: 12, 
			color: secondaryColor, 
			font: montserratFont 
		})
		page.drawText(formatCurrency(managementFeeValue), { 
			x: financeRightX, 
			y: financeSectionY - 40 - (currentRow * 25), 
			size: 12, 
			color: primaryColor, 
			font: montserratFont 
		})
		currentRow++
		
		// TAXA SERVIÇOS
		page.drawText(`TAXA SERVIÇOS (${serviceFeePercent}%)`, { 
			x: financeLeftX, 
			y: financeSectionY - 40 - (currentRow * 25), 
			size: 12, 
			color: secondaryColor, 
			font: montserratFont 
		})
		page.drawText(formatCurrency(serviceFeeValue), { 
			x: financeRightX, 
			y: financeSectionY - 40 - (currentRow * 25), 
			size: 12, 
			color: primaryColor, 
			font: montserratFont 
		})
		currentRow++
		
		// Linha divisória antes do total
		page.drawLine({
			start: { x: financeLeftX, y: financeSectionY - 40 - (currentRow * 25) - 10 },
			end: { x: width - 50, y: financeSectionY - 40 - (currentRow * 25) - 10 },
			thickness: 0.5,
			color: lightGray
		})
		
		currentRow++
		
		// INVESTIMENTO TOTAL (DESTAQUE)
		page.drawText("INVESTIMENTO TOTAL", { 
			x: financeLeftX, 
			y: financeSectionY - 40 - (currentRow * 25), 
			size: 14, 
			color: primaryColor, 
			font: montserratFont 
		})
		page.drawText(formatCurrency(totalInvestment), { 
			x: financeRightX, 
			y: financeSectionY - 40 - (currentRow * 25), 
			size: 14, 
			color: primaryColor, 
			font: montserratFont 
		})
		
		// ========== SEÇÃO: PARCELAMENTO ==========
		const tableSectionY = financeSectionY - 40 - (currentRow * 25) - 60
		
		// Título da seção
		page.drawText("Opções de Parcelamento", {
			x: 50, y: tableSectionY, size: 16, color: primaryColor, font: montserratFont
		})
		
		// Linha sutil abaixo do título
		page.drawLine({
			start: { x: 50, y: tableSectionY - 10 },
			end: { x: 220, y: tableSectionY - 10 },
			thickness: 1,
			color: accentColor
		})
		
		// Meses e taxas
		const pfMonths = [24, 30, 36, 48, 60, 72, 84, 96]
		const monthlyRates: Record<number, number> = {
			24: 1.49, 30: 1.49, 36: 1.60, 48: 1.64,
			60: 1.68, 72: 1.72, 84: 1.76, 96: 1.80
		}
		
		// Calcular parcelas
		const calculations = pfMonths.map(month => {
			const rate = (monthlyRates[month] || 1.5) / 100
			const installment = calculateInstallmentPayment({
				numberOfPeriods: month,
				presentValue: totalInvestment,
				rate
			})
			
			return { month, ratePercent: monthlyRates[month] || 1.5, installment }
		})
		
		// Configurações da tabela elegante
		const tableStartY = tableSectionY - 40
		const tableLeftX = 50
		const columnWidths = [120, 130, 150]
		
		// Cabeçalhos da tabela (estilo minimalista)
		const headers = ["Prazo", "Taxa Mensal", "Valor da Parcela"]
		// const headerY = tableStartY
		
		headers.forEach((header, index) => {
			page.drawText(header, {
				x: tableLeftX + (index === 0 ? 0 : columnWidths.slice(0, index).reduce((a, b) => a + b)),
				y: headerY,
				size: 12,
				color: secondaryColor,
				font: montserratFont
			})
		})
		
		// Linha divisória do cabeçalho
		page.drawLine({
			start: { x: tableLeftX, y: headerY - 8 },
			end: { x: tableLeftX + columnWidths.reduce((a, b) => a + b), y: headerY - 8 },
			thickness: 0.5,
			color: lightGray
		})
		
		// Linhas da tabela
		calculations.forEach((calc, index) => {
			const rowY = headerY - 25 - (index * 26)
			
			// Linha divisória sutil (alternada para melhor leitura)
			if (index % 2 === 0 && index < calculations.length - 1) {
				page.drawRectangle({
					x: tableLeftX,
					y: rowY - 5,
					width: columnWidths.reduce((a, b) => a + b),
					height: 26,
					color: rgb(0.98, 0.98, 0.98),
					opacity: 0.5
				})
			}
			
			// Prazo
			page.drawText(`${calc.month} meses`, {
				x: tableLeftX + 10, y: rowY, size: 11, color: primaryColor, font: montserratFont
			})
			
			// Taxa Mensal
			page.drawText(`${calc.ratePercent.toFixed(2)}%`, {
				x: tableLeftX + columnWidths[0] + 10, y: rowY, size: 11, color: primaryColor, font: montserratFont
			})
			
			// Valor da Parcela
			page.drawText(formatCurrency(calc.installment), {
				x: tableLeftX + columnWidths[0] + columnWidths[1] + 10, y: rowY, size: 11, color: primaryColor, font: montserratFont
			})
		})
		
		// ========== RODAPÉ ==========
		const footerY = 50
		page.drawLine({
			start: { x: 50, y: footerY + 20 },
			end: { x: width - 50, y: footerY + 20 },
			thickness: 0.5,
			color: lightGray
		})
		
		page.drawText("* Valores sujeitos a alteração conforme análise de crédito.", {
			x: 50, y: footerY, size: 9, color: secondaryColor, font: montserratFont
		})
		
		// ========== SALVAR PDF ==========
		const pdfBytes = await pdfDoc.save()
		const pdfBase64 = Buffer.from(pdfBytes).toString("base64")
		
		return {
			success: true,
			message: "PDF PF gerado com sucesso (design elegante).",
			data: { pdfBase64 }
		}
		
	} catch (error) {
		console.error("Erro ao gerar PDF PF:", error)
		return {
			success: false,
			message: `Erro ao gerar PDF: ${error instanceof Error ? error.message : "Erro desconhecido"}`
		}
	}
}

// ========================================
// FUNÇÃO PRINCIPAL - DETECÇÃO AUTOMÁTICA
// ========================================

export async function generateOrderPdf(orderId: string): Promise<ActionResponse<{ pdfBase64: string }>> {
	try {
		const orderResponse = await getOrderById(orderId)
		
		if (!orderResponse.success || !orderResponse.data) {
			return { success: false, message: orderResponse.message || "Pedido não encontrado" }
		}

		const order = orderResponse.data
		const customer = order.customer
		
		if (!customer) {
			return { success: false, message: "Cliente não encontrado" }
		}

		if (customer.type === 'pf') {
			return await generatePFOrderPdf(orderId)
		} else if (customer.type === 'pj') {
			return await generatePJOrderPdf(orderId)
		} else {
			return { success: false, message: `Tipo de cliente inválido: ${customer.type}` }
		}

	} catch (error) {
		console.error("Erro em generateOrderPdfByType:", error)
		return {
			success: false,
			message: `Erro ao gerar PDF: ${error instanceof Error ? error.message : "Erro desconhecido"}`
		}
	}
}

// ========================================
// EXPORT DEFAULT (COMPATIBILIDADE)
// ========================================

export default generateOrderPdf