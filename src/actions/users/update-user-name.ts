// src/actions/users/update-user-name.ts
"use server"

import { PostgrestError } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"
import type { ActionResponse } from "@/types/action-response"
import type { Database } from "@/lib/definitions/supabase"

const UpdateNameSchema = z.string().min(3, "O nome deve ter pelo menos 3 caracteres.")
type UserRole = Database["public"]["Enums"]["user_role"]

interface UpdateUserNameParams {
	newName: string
	role: UserRole
}

async function updateUserName({ newName, role }: UpdateUserNameParams): Promise<ActionResponse<null>> {
	const supabase = await createClient()

	const {
		data: { user }
	} = await supabase.auth.getUser()

	if (!user) {
		return { success: false, message: "Usuário não autenticado." }
	}

	const validation = UpdateNameSchema.safeParse(newName)
	if (!validation.success) {
		return { success: false, message: validation.error.issues.map((i) => i.message).join(", ") }
	}

	// 1. Buscamos o nome atual do usuário para poder reverter se necessário.
	const { data: currentUserData, error: fetchError } = await supabase.from("users").select("name").eq("id", user.id).single()

	if (fetchError || !currentUserData) {
		console.error("Erro ao buscar dados originais do usuário:", fetchError)
		return { success: false, message: "Não foi possível encontrar os dados do usuário para atualização." }
	}
	const originalName = currentUserData.name

	try {
		// 2. Atualiza a tabela principal 'users'
		const { error: userError } = await supabase.from("users").update({ name: validation.data }).eq("id", user.id)

		if (userError) throw userError

		// 3. Tenta atualizar a tabela específica da role
		try {
			if (role === "seller") {
				const { error: sellerError } = await supabase.from("sellers").update({ name: validation.data }).eq("user_id", user.id)
				if (sellerError) throw sellerError
			} else if (role === "partner") {
				const { error: partnerError } = await supabase.from("partners").update({ contact_name: validation.data }).eq("user_id", user.id)
				if (partnerError) throw partnerError
			}
			// Admins não têm tabela extra para atualizar.
		} catch (roleUpdateError) {
			// Rollback: Se a atualização da role falhar, reverta o nome na tabela 'users'
			await supabase.from("users").update({ name: originalName }).eq("id", user.id)
			// Propaga o erro original
			throw roleUpdateError
		}

		// 4. Revalida os caminhos para atualizar a UI
		revalidatePath("/dashboard/my-account")
		revalidatePath("/dashboard") // Para o nome na sidebar

		return {
			success: true,
			message: "Nome atualizado com sucesso!",
			data: null
		}
	} catch (error) {
		console.error("Erro ao atualizar nome do usuário:", error)
		if (error instanceof PostgrestError) {
			return { success: false, message: `Erro no banco de dados: ${error.message}` }
		}
		return { success: false, message: error instanceof Error ? error.message : "Ocorreu um erro inesperado. Tente novamente." }
	}
}

export default updateUserName
