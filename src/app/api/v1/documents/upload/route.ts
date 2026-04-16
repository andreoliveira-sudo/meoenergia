import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

const BUCKET_NAME = "docs_simulation"

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData()
		const orderId = formData.get("orderId") as string
		const fieldName = formData.get("fieldName") as string
		const storageKey = formData.get("storageKey") as string
		const file = formData.get("file") as File | null
		const docSubtype = formData.get("docSubtype") as string | null

		if (!orderId || !fieldName || !file) {
			return NextResponse.json(
				{ success: false, message: "Parametros obrigatorios ausentes." },
				{ status: 400 }
			)
		}

		// Validate file type
		const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"]
		if (!allowedTypes.includes(file.type)) {
			return NextResponse.json(
				{ success: false, message: "Formato de arquivo invalido. Aceitos: JPG, PNG, PDF." },
				{ status: 400 }
			)
		}

		// Validate file size (10MB)
		if (file.size > 10 * 1024 * 1024) {
			return NextResponse.json(
				{ success: false, message: "Arquivo muito grande. Maximo: 10MB." },
				{ status: 400 }
			)
		}

		const supabase = createAdminClient()

		// Use storageKey if provided, otherwise just fieldName
		const filePath = `${orderId}/${storageKey || fieldName}`

		const { error: uploadError } = await supabase.storage
			.from(BUCKET_NAME)
			.upload(filePath, file, {
				contentType: file.type || "application/octet-stream",
				upsert: true,
			})

		if (uploadError) {
			console.error("Erro no upload:", uploadError)
			return NextResponse.json(
				{ success: false, message: `Erro no upload: ${uploadError.message}` },
				{ status: 500 }
			)
		}

		// UPSERT order_documents record (cria se nao existir, atualiza se existir)
		// Buscar label e required dos campos padrao
		const { documentFieldsPF, documentFieldsPJ } = await import("@/lib/constants")
		// Descobrir tipo do cliente a partir do pedido
		const { data: orderInfo } = await (supabase as any)
			.from("orders")
			.select("customers(type)")
			.eq("id", orderId)
			.single()
		const customerType = orderInfo?.customers?.type || "pf"
		const fieldDefs = customerType === "pj" ? documentFieldsPJ : documentFieldsPF
		const fieldDef = fieldDefs.find((f: { name: string; label: string; required: boolean }) => f.name === fieldName)

		const upsertData: Record<string, unknown> = {
			order_id: orderId,
			field_name: fieldName,
			label: fieldDef?.label || fieldName,
			required: fieldDef?.required ?? true,
			status: "uploaded",
			uploaded_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			rejection_reason: null, // reset ao reenviar
		}
		if (docSubtype) {
			upsertData.doc_subtype = docSubtype
		}

		await (supabase as any).from("order_documents")
			.upsert(upsertData, { onConflict: "order_id,field_name" })

		// Verificar se todos os obrigatorios foram enviados → transicao automatica
		const { data: allDocs } = await (supabase as any)
			.from("order_documents")
			.select("field_name, required, status")
			.eq("order_id", orderId)

		if (allDocs) {
			const requiredDocs = (allDocs as Array<{ field_name: string; required: boolean; status: string }>)
				.filter((d) => d.required)
			const allRequiredUploaded = requiredDocs.length > 0 &&
				requiredDocs.every((d) => d.status === "uploaded" || d.status === "approved")

			if (allRequiredUploaded) {
				// Verificar order_status atual
				const { data: orderRow } = await supabase
					.from("orders")
					.select("order_status")
					.eq("id", orderId)
					.single()

				const currentOrderStatus = (orderRow as any)?.order_status
				if (currentOrderStatus === "documents_pending" || currentOrderStatus === "documents_issue") {
					// Transicao automatica → docs_analysis + deadline 24h
					const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
					await supabase
						.from("orders")
						.update({ order_status: "docs_analysis", deadline } as any)
						.eq("id", orderId)
				}
			}
		}

		return NextResponse.json({
			success: true,
			message: "Arquivo enviado com sucesso.",
			data: { path: filePath },
		})
	} catch (e) {
		console.error("Erro inesperado no upload:", e)
		return NextResponse.json(
			{ success: false, message: "Erro inesperado no servidor." },
			{ status: 500 }
		)
	}
}
