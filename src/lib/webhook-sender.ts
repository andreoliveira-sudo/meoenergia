/**
 * ═══════════════════════════════════════════════════════════════════
 * Webhook Sender — Módulo compartilhado para disparo de webhooks
 * ═══════════════════════════════════════════════════════════════════
 *
 * Usado por:
 * - batch-manager.ts (automação RevoCred)
 * - update-status/route.ts (callback RevoCred)
 * - resend-webhook.ts (replay em massa)
 * - update-order-status.ts já tem lógica própria inline (NÃO usar este módulo lá)
 *
 * Este módulo NÃO depende de "use server" nem de Next.js server actions.
 * Funciona em qualquer contexto Node.js (Docker, API route, etc).
 */

import { createClient } from "@supabase/supabase-js"

/* ─── Helpers ─── */

function getAdminClient() {
	const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
	const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
	if (!url || !key) throw new Error("Missing Supabase credentials for webhook-sender")
	return createClient(url, key)
}

function calculateInstallment(presentValue: number, rate: number, periods: number): number {
	if (rate === 0) return presentValue / periods
	return presentValue * (rate * Math.pow(1 + rate, periods)) / (Math.pow(1 + rate, periods) - 1)
}

/* ─── Main: dispara webhook para pedido por KDI ─── */

export async function fireWebhookByKdi(kdi: string, newStatus: string): Promise<void> {
	const supabase = getAdminClient() as any
	let webhookUrl = "unknown"
	let apiKeyId: string | null = null

	try {
		// 1. Buscar pedido pelo KDI para obter id e api_key_id
		const { data: order, error: orderErr } = await supabase
			.from("orders")
			.select("id, api_key_id, kdi")
			.eq("kdi", kdi)
			.single()

		if (orderErr || !order) {
			console.log(`[webhook-sender] Pedido KDI ${kdi} não encontrado, ignorando webhook`)
			return
		}

		if (!order.api_key_id) {
			return
		}

		apiKeyId = order.api_key_id

		// 2. Buscar webhook_url da API key
		const { data: apiKeyData } = await supabase
			.from("api_keys")
			.select("webhook_url, name")
			.eq("id", order.api_key_id)
			.single()

		if (!apiKeyData?.webhook_url) {
			console.log(`[webhook-sender] API Key ${order.api_key_id} sem webhook_url configurado`)
			return
		}

		webhookUrl = apiKeyData.webhook_url

		// 3. Buscar dados completos do pedido — query segura (sem !inner para não falhar se customer missing)
		const { data: fullOrder, error: fetchErr } = await supabase
			.from("orders")
			.select(`
				id, kdi, system_power, current_consumption, connection_voltage,
				equipment_value, labor_value, other_costs,
				created_at, updated_at, status,
				payment_day, financing_term, monthly_bill_value, notes,
				api_key_id,
				customer_id,
				seller_id
			`)
			.eq("id", order.id)
			.single()

		if (fetchErr || !fullOrder) {
			console.error(`[webhook-sender] Erro ao buscar pedido ${order.id}:`, fetchErr?.message)
			await logWebhookError(supabase, apiKeyId, webhookUrl, newStatus, `Erro ao buscar pedido: ${fetchErr?.message || "not found"}`)
			return
		}

		// 4. Buscar customer separadamente (mais seguro que join !inner)
		let cust: Record<string, unknown> | null = null
		if (fullOrder.customer_id) {
			const { data: customerData, error: custErr } = await supabase
				.from("customers")
				.select("id, type, cpf, cnpj, name, company_name, contact_name, contact_email, contact_phone, city, state, postal_code, street, number, neighborhood, complement, partner_id")
				.eq("id", fullOrder.customer_id)
				.single()

			if (custErr) {
				console.error(`[webhook-sender] Erro ao buscar customer ${fullOrder.customer_id}:`, custErr.message)
			} else {
				cust = customerData
			}

			// Tentar buscar campos extras (marital_status, birth_date, gender, occupation) separadamente
			// Esses campos podem não existir em PROD
			if (cust) {
				try {
					const { data: extraFields } = await supabase
						.from("customers")
						.select("marital_status, birth_date, gender, occupation")
						.eq("id", fullOrder.customer_id)
						.single()
					if (extraFields) {
						cust = { ...cust, ...extraFields }
					}
				} catch {
					// Campos não existem no banco — ok, ignorar
				}
			}
		}

		if (!cust) {
			console.error(`[webhook-sender] Customer não encontrado para pedido ${order.id}`)
			await logWebhookError(supabase, apiKeyId, webhookUrl, newStatus, `Customer não encontrado para pedido ${order.id}`)
			return
		}

		// 5. Buscar partner se tiver
		let partnerData: Record<string, unknown> | null = null
		if (cust.partner_id) {
			const { data: pData } = await supabase
				.from("partners")
				.select("id, contact_name, legal_business_name")
				.eq("id", cust.partner_id)
				.single()
			partnerData = pData
		}

		// 6. Buscar seller se tiver
		let sellerData: Record<string, unknown> | null = null
		if (fullOrder.seller_id) {
			const { data: sData } = await supabase
				.from("sellers")
				.select("id, name")
				.eq("id", fullOrder.seller_id)
				.single()
			sellerData = sData
		}

		// 7. Buscar taxas para cálculo de simulação
		const { data: settings } = await supabase
			.from("settings")
			.select("*")
			.single()

		// 8. Montar payload
		const isPj = cust.type === "pj"
		const document = isPj ? (cust.cnpj || "") : (cust.cpf || "")
		const customerName = isPj ? (cust.company_name || "") : (cust.name || "")

		const formattedBirthDate = cust.birth_date
			? new Date(String(cust.birth_date)).toISOString().split("T")[0]
			: null

		const orderData: Record<string, unknown> = {
			id: fullOrder.id,
			kdi: fullOrder.kdi,
			system_power: fullOrder.system_power,
			current_consumption: fullOrder.current_consumption,
			connection_voltage: fullOrder.connection_voltage || "000",
			equipment_value: fullOrder.equipment_value || 0,
			labor_value: fullOrder.labor_value || 0,
			other_costs: fullOrder.other_costs || 0,
			created_at: fullOrder.created_at,
			updated_at: fullOrder.updated_at,
			status: fullOrder.status,
			payment_day: fullOrder.payment_day || null,
			financing_term: fullOrder.financing_term || null,
			monthly_bill_value: fullOrder.monthly_bill_value || 0,
			notes: fullOrder.notes || "",
			customers: {
				type: cust.type,
				document,
				name: customerName,
				...(isPj
					? { cnpj: cust.cnpj || "", company_name: cust.company_name || "" }
					: {
						cpf: cust.cpf || "",
						individual_name: cust.name || "",
						marital_status: cust.marital_status || null,
						birth_date: formattedBirthDate,
						gender: cust.gender || null,
						occupation: cust.occupation || null,
					}),
				contact_name: cust.contact_name || "",
				contact_email: cust.contact_email || "",
				contact_phone: cust.contact_phone || "",
				address: {
					postal_code: cust.postal_code || "",
					street: cust.street || "",
					number: cust.number || "",
					complement: cust.complement || "",
					neighborhood: cust.neighborhood || "",
					city: cust.city || "",
					state: cust.state || "",
				},
				...(partnerData
					? {
						partner: {
							contact_name: partnerData.contact_name || "",
							legal_business_name: partnerData.legal_business_name || "",
						},
					}
					: {}),
			},
			sellers: sellerData ? { name: sellerData.name || "" } : null,
		}

		// 9. Calcular simulação (se tiver taxas)
		if (settings) {
			const equipVal = fullOrder.equipment_value || 0
			const laborVal = fullOrder.labor_value || 0
			const otherVal = fullOrder.other_costs || 0
			const investmentValue = equipVal + laborVal + otherVal

			const mgmtPct = isPj ? (settings.pj_management_fee || 4) : (settings.pf_management_fee || 8)
			const mgmtVal = investmentValue * (mgmtPct / 100)
			const svcPct = isPj ? (settings.pj_service_fee || 8) : (settings.pf_service_fee || 8)
			const svcVal = (investmentValue + mgmtVal) * (svcPct / 100)
			const totalInvestment = investmentValue + mgmtVal + svcVal

			const months = isPj ? [24, 36, 48, 60] : [24, 30, 36, 48, 60, 72, 84, 96]
			const rateKeys: Record<number, string> = isPj
				? { 24: "pj_interest_rate_24", 36: "pj_interest_rate_36", 48: "pj_interest_rate_48", 60: "pj_interest_rate_60" }
				: { 24: "pf_interest_rate_24", 30: "pf_interest_rate_30", 36: "pf_interest_rate_36", 48: "pf_interest_rate_48", 60: "pf_interest_rate_60", 72: "pf_interest_rate_72", 84: "pf_interest_rate_84", 96: "pf_interest_rate_96" }

			const defaultRate = isPj ? 2.5 : 1.5
			const installments = months.map((m) => {
				const ratePct = settings[rateKeys[m]] || defaultRate
				const rate = ratePct / 100
				const monthly = calculateInstallment(totalInvestment, rate, m)
				return { term_months: m, interest_rate_percent: ratePct, monthly_installment: Number(monthly.toFixed(2)) }
			})

			orderData.simulation = {
				investment_value: Number(investmentValue.toFixed(2)),
				management_fee_percent: mgmtPct,
				management_fee_value: Number(mgmtVal.toFixed(2)),
				service_fee_percent: svcPct,
				service_fee_value: Number(svcVal.toFixed(2)),
				total_investment: Number(totalInvestment.toFixed(2)),
				installments,
			}
		}

		// 10. Enviar webhook
		const eventType = `order.status.${newStatus}`
		const webhookPayload = {
			event: eventType,
			timestamp: new Date().toISOString(),
			data: orderData,
		}

		console.log(`[webhook-sender] Enviando webhook ${eventType} para ${webhookUrl} (KDI: ${kdi})`)

		const response = await fetch(webhookUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"User-Agent": "MEO-ERP-API/1.0",
			},
			body: JSON.stringify(webhookPayload),
			signal: AbortSignal.timeout(10000),
		})

		const responseText = await response.text().catch(() => "")

		// 11. Logar resultado
		await supabase.from("api_key_webhook_logs").insert({
			api_key_id: apiKeyId,
			url: webhookUrl,
			event_type: eventType,
			status_code: response.status,
			success: response.ok,
			error_message: response.ok ? null : (responseText || "Unknown error"),
			response_body: responseText || null,
			payload: JSON.parse(JSON.stringify(webhookPayload)),
		})

		console.log(`[webhook-sender] Webhook ${response.ok ? "enviado" : "falhou"} (${response.status}) para ${webhookUrl}`)
	} catch (error) {
		const errMsg = error instanceof Error ? error.message : "Unknown error"
		console.error(`[webhook-sender] Erro ao disparar webhook KDI ${kdi}:`, errMsg)

		await logWebhookError(supabase, apiKeyId, webhookUrl, newStatus, errMsg)
	}
}

/** Helper para logar erros de webhook de forma consistente */
async function logWebhookError(
	supabase: ReturnType<typeof createClient>,
	apiKeyId: string | null,
	url: string,
	status: string,
	errorMessage: string
) {
	try {
		if (!apiKeyId) return
		await (supabase as any).from("api_key_webhook_logs").insert({
			api_key_id: apiKeyId,
			url,
			event_type: `order.status.${status}`,
			status_code: 0,
			success: false,
			error_message: errorMessage,
			payload: null,
		})
	} catch {
		// Silenciar — não travar fluxo principal
	}
}
