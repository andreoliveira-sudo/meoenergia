"use server"

import { PostgrestError } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import type { ActionResponse } from "@/types/action-response"
import type { EditCustomerData } from "@/lib/validations/customer"

async function updateCustomer(customerId: string, data: EditCustomerData): Promise<ActionResponse<{ customerId: string }>> {
	if (!customerId) {
		return {
			success: false,
			message: "ID do cliente não fornecido."
		}
	}

	try {
		const supabase = await createClient()

		const { error, count } = await supabase.from("customers").update(data, { count: "exact" }).eq("id", customerId)

		if (error) {
			console.error("Erro ao atualizar cliente (Supabase):", error)

			if (error instanceof PostgrestError && error.code === "23505") {
				if (error.message.includes("cnpj")) {
					return {
						success: false,
						message: "O CNPJ fornecido já está em uso por outro cliente."
					}
				}
			}

			return {
				success: false,
				message: "Erro ao atualizar os dados do cliente. Por favor, tente novamente."
			}
		}

		if (count === 0 || count === null) {
			return {
				success: false,
				message: "Nenhum cliente encontrado com o ID fornecido. A atualização falhou."
			}
		}

		revalidatePath("/dashboard/customers")

		return {
			success: true,
			message: "Cliente atualizado com sucesso!",
			data: {
				customerId
			}
		}
	} catch (error) {
		console.error("Erro inesperado na action 'updateCustomer':", error)
		return {
			success: false,
			message: "Ocorreu um erro inesperado. Por favor, contate o suporte."
		}
	}
}

export default updateCustomer
