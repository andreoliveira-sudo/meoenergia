import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

const BUCKET_NAME = "docs_simulation"

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url)
		const orderId = searchParams.get("orderId")
		const fieldName = searchParams.get("fieldName")

		if (!orderId || !fieldName) {
			return NextResponse.json(
				{ success: false, message: "Parametros obrigatorios ausentes." },
				{ status: 400 }
			)
		}

		const supabase = createAdminClient()

		// List files in the order folder to find the matching file
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

		// Find file that matches fieldName (exact or starts with fieldName_)
		const matchingFile = files?.find(
			(f) => f.name === fieldName || f.name.startsWith(`${fieldName}_`)
		)

		if (!matchingFile) {
			return NextResponse.json(
				{ success: false, message: "Arquivo nao encontrado." },
				{ status: 404 }
			)
		}

		const filePath = `${orderId}/${matchingFile.name}`

		// Create signed URL valid for 1 hour
		const { data: signedUrlData, error: signedUrlError } = await supabase.storage
			.from(BUCKET_NAME)
			.createSignedUrl(filePath, 3600)

		if (signedUrlError || !signedUrlData?.signedUrl) {
			console.error("Erro ao gerar URL assinada:", signedUrlError)
			return NextResponse.json(
				{ success: false, message: "Erro ao gerar link de visualizacao." },
				{ status: 500 }
			)
		}

		return NextResponse.json({
			success: true,
			url: signedUrlData.signedUrl,
			fileName: matchingFile.name,
		})
	} catch (e) {
		console.error("Erro inesperado na visualizacao:", e)
		return NextResponse.json(
			{ success: false, message: "Erro inesperado no servidor." },
			{ status: 500 }
		)
	}
}
