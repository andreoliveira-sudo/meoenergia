"use server"

import type { Partner } from "@/lib/definitions/partners"
import { createClient } from "@/lib/supabase/server"
import type { ActionResponse } from "@/types/action-response"

interface GetPartnerByCNPJProps {
	cnpj: string
}

async function getPartnerByCNPJ({ cnpj }: GetPartnerByCNPJProps): Promise<ActionResponse<Partner | null>> {
	try {
		const supabase = await createClient()

		const { data: partner, error: getPartnerByCNPJError } = await supabase.from("partners").select("*").eq("cnpj", cnpj).maybeSingle()

		if (getPartnerByCNPJError) {
			console.error("Erro do Supabase:", getPartnerByCNPJError)
			return {
				success: false,
				message: "Ocorreu um erro ao consultar o banco de dados."
			}
		}

		return {
			success: true,
			message: partner ? "Parceiro encontrado com sucesso." : "Nenhum parceiro encontrado com este CNPJ.",
			data: partner
		}
	} catch (error) {
		console.error("Erro inesperado na action:", error)
		const message = error instanceof Error ? error.message : "Erro desconhecido ao buscar parceiro."
		return {
			success: false,
			message
		}
	}
}

export default getPartnerByCNPJ
