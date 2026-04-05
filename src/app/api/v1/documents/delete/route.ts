import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

const BUCKET_NAME = "docs_simulation"

export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const { orderId, fieldName } = body

		if (!orderId || !fieldName) {
			return NextResponse.json(
				{ success: false, message: "Parametros obrigatorios ausentes." },
				{ status: 400 }
			)
		}

		const supabase = createAdminClient()

		// List files in the order folder to find all matching files
		const { data: files, error: listError } = await supabase.storage
			.from(BUCKET_NAME)
			.list(orderId)

		if (listError) {
			console.error("Erro ao listar arquivos:", listError)
			return NextResponse.json(
				{ success: false, message: "Erro ao buscar arquivo." },
				{ status: 500 }
			)
		}

		// Find all files that match fieldName (exact or starts with fieldName_)
		const matchingFiles = files?.filter(
			(f) => f.name === fieldName || f.name.startsWith(`${fieldName}_`)
		) || []

		if (matchingFiles.length === 0) {
			return NextResponse.json(
				{ success: false, message: "Arquivo nao encontrado." },
				{ status: 404 }
			)
		}

		// Remove all matching files
		const filePaths = matchingFiles.map((f) => `${orderId}/${f.name}`)
		const { error: removeError } = await supabase.storage
			.from(BUCKET_NAME)
			.remove(filePaths)

		if (removeError) {
			console.error("Erro ao remover arquivo:", removeError)
			return NextResponse.json(
				{ success: false, message: `Erro ao remover: ${removeError.message}` },
				{ status: 500 }
			)
		}

		// Update order_documents record back to pending
		await (supabase as any).from("order_documents")
			.update({
				status: "pending",
				uploaded_at: null,
				doc_subtype: null,
				updated_at: new Date().toISOString(),
			})
			.eq("order_id", orderId)
			.eq("field_name", fieldName)

		return NextResponse.json({
			success: true,
			message: "Arquivo removido com sucesso.",
		})
	} catch (e) {
		console.error("Erro inesperado na remocao:", e)
		return NextResponse.json(
			{ success: false, message: "Erro inesperado no servidor." },
			{ status: 500 }
		)
	}
}
