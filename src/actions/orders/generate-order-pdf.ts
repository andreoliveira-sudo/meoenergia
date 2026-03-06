"use server"

import fontkit from "@pdf-lib/fontkit"
import { PDFDocument, type PDFFont, rgb } from "pdf-lib"

import { getOrderById } from "@/actions/orders"
import { MONTSERRAT_BASE64 /*MONTSERRAT_SEMIBOLD_BASE64*/ } from "@/lib/constants"
import { formatCnpj } from "@/lib/formatters"
import { calculateInstallmentPayment, formatDate } from "@/lib/utils"
import type { ActionResponse } from "@/types/action-response"

function formatCurrency(value: number | null | undefined): string {
	if (value === null || value === undefined) return "R$ 0,00"
	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL"
	}).format(value)
}

function centerTextAtX({ text, font, fontSize, centerX }: { text: string; font: PDFFont; fontSize: number; centerX: number }): number {
	const textWidth = font.widthOfTextAtSize(text, fontSize)
	return centerX - textWidth / 2
}

async function generateOrderPdf(orderId: string): Promise<ActionResponse<{ pdfBase64: string }>> {
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

		// 2. Carregar o template PDF e a fonte do Base64 (Lazy Load)
		// Otimização: Carrega o template sob demanda para não pesar o bundle inicial
		const templateModule = await import('@/lib/constants/template-simulation-base64')
		const base64Template = templateModule.default

		const templateBytes = Buffer.from(base64Template, "base64")
		const montserratFontBytes = Buffer.from(MONTSERRAT_BASE64, "base64")
		// const montserratSemiBoldFontBytes = Buffer.from(MONTSERRAT_SEMIBOLD_BASE64, "base64")

		const pdfDoc = await PDFDocument.load(templateBytes)

		// Registrar o fontkit
		pdfDoc.registerFontkit(fontkit)

		const montserratFont = await pdfDoc.embedFont(montserratFontBytes, { subset: true })
		// const montserratSemiBoldFont = await pdfDoc.embedFont(montserratSemiBoldFontBytes, { subset: true })
		const textColor = rgb(83 / 255, 86 / 255, 90 / 255) // Cor #53565A
		const fontSize = 8

		// 3. Obter dimensões da página
		const firstPage = pdfDoc.getPages()[0]
		const { height } = firstPage.getSize()
		const leftAlign = 133

		// ========================================
		// BLOCO DE PREPARAÇÃO: Cálculos e Formatações
		// ========================================

		// CNPJ formatado
		const formattedCnpj = formatCnpj(customer.cnpj)

		// Razão Social
		const companyName = customer.company_name

		// Data atual
		const currentDate = formatDate(new Date().toISOString())

		// Valor Solicitado
		const requestedValue = (equipment_value || 0) + (labor_value || 0) + (other_costs || 0)
		const formattedRequestedValue = formatCurrency(requestedValue)

		// Taxas de Serviços
		const serviceFee = {
			36: service_fee_36 / 100,
			48: service_fee_48 / 100,
			60: service_fee_60 / 100
		}

		// Total Serviços
		const totalServices = {
			36: requestedValue * serviceFee[36],
			48: requestedValue * serviceFee[48],
			60: requestedValue * serviceFee[60]
		}

		// Parcelas
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
		// BLOCO DE DESENHO: Adicionar textos ao PDF
		// ========================================

		// Data Atual
		firstPage.drawText(currentDate, {
			x: 511,
			y: height - 74,
			size: fontSize,
			color: textColor,
			font: montserratFont
		})

		// Razão Social ou Cliente
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

		firstPage.drawText(formattedRequestedValue, {
			x: centerTextAtX({
				text: formattedRequestedValue,
				font: montserratFont,
				fontSize: fontSize,
				centerX: requestedValueX
			}),
			y: height - 487,
			size: fontSize,
			color: textColor,
			font: montserratFont
		})

		firstPage.drawText(formattedRequestedValue, {
			x: centerTextAtX({
				text: formattedRequestedValue,
				font: montserratFont,
				fontSize: fontSize,
				centerX: requestedValueX
			}),
			y: height - 507,
			size: fontSize,
			color: textColor,
			font: montserratFont
		})

		firstPage.drawText(formattedRequestedValue, {
			x: centerTextAtX({
				text: formattedRequestedValue,
				font: montserratFont,
				fontSize: fontSize,
				centerX: requestedValueX
			}),
			y: height - 527,
			size: fontSize,
			color: textColor,
			font: montserratFont
		})

		// Total Serviços
		const totalServicesX = 324

		firstPage.drawText(formatCurrency(totalServices["36"]), {
			x: centerTextAtX({
				text: formatCurrency(totalServices["36"]),
				font: montserratFont,
				fontSize: fontSize,
				centerX: totalServicesX
			}),
			y: height - 487,
			size: fontSize,
			color: textColor,
			font: montserratFont
		})

		firstPage.drawText(formatCurrency(totalServices["48"]), {
			x: centerTextAtX({
				text: formatCurrency(totalServices["48"]),
				font: montserratFont,
				fontSize: fontSize,
				centerX: totalServicesX
			}),
			y: height - 507,
			size: fontSize,
			color: textColor,
			font: montserratFont
		})

		firstPage.drawText(formatCurrency(totalServices["60"]), {
			x: centerTextAtX({
				text: formatCurrency(totalServices["60"]),
				font: montserratFont,
				fontSize: fontSize,
				centerX: totalServicesX
			}),
			y: height - 527,
			size: fontSize,
			color: textColor,
			font: montserratFont
		})

		// Valor Financiado
		const amountFinancedX = 430

		firstPage.drawText(formatCurrency(totalServices["36"] + requestedValue), {
			x: centerTextAtX({
				text: formatCurrency(totalServices["36"] + requestedValue),
				font: montserratFont,
				fontSize: fontSize,
				centerX: amountFinancedX
			}),
			y: height - 487,
			size: fontSize,
			color: textColor,
			font: montserratFont
		})

		firstPage.drawText(formatCurrency(totalServices["48"] + requestedValue), {
			x: centerTextAtX({
				text: formatCurrency(totalServices["48"] + requestedValue),
				font: montserratFont,
				fontSize: fontSize,
				centerX: amountFinancedX
			}),
			y: height - 507,
			size: fontSize,
			color: textColor,
			font: montserratFont
		})

		firstPage.drawText(formatCurrency(totalServices["60"] + requestedValue), {
			x: centerTextAtX({
				text: formatCurrency(totalServices["60"] + requestedValue),
				font: montserratFont,
				fontSize: fontSize,
				centerX: amountFinancedX
			}),
			y: height - 527,
			size: fontSize,
			color: textColor,
			font: montserratFont
		})

		// Parcelas
		const installmentsX = 524

		firstPage.drawText(formatCurrency(installments["36"]), {
			x: centerTextAtX({
				text: formatCurrency(installments["36"]),
				font: montserratFont,
				fontSize: fontSize,
				centerX: installmentsX
			}),
			y: height - 487,
			size: fontSize,
			color: textColor,
			font: montserratFont
		})

		firstPage.drawText(formatCurrency(installments["48"]), {
			x: centerTextAtX({
				text: formatCurrency(installments["48"]),
				font: montserratFont,
				fontSize: fontSize,
				centerX: installmentsX
			}),
			y: height - 507,
			size: fontSize,
			color: textColor,
			font: montserratFont
		})

		firstPage.drawText(formatCurrency(installments["60"]), {
			x: centerTextAtX({
				text: formatCurrency(installments["60"]),
				font: montserratFont,
				fontSize: fontSize,
				centerX: installmentsX
			}),
			y: height - 527,
			size: fontSize,
			color: textColor,
			font: montserratFont
		})

		// 4. Salvar o PDF em memória e converter para Base64
		const pdfBytes = await pdfDoc.save()
		const pdfBase64 = Buffer.from(pdfBytes).toString("base64")

		return {
			success: true,
			message: "PDF gerado com sucesso.",
			data: { pdfBase64 }
		}
	} catch (error) {
		console.error("Erro ao gerar PDF do pedido:", error)
		const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido."
		return {
			success: false,
			message: `Ocorreu um erro inesperado ao gerar o PDF: ${errorMessage}`
		}
	}
}

export default generateOrderPdf
