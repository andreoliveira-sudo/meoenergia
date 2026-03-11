"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import type { ActionResponse } from "@/types/action-response"
import type { Database } from "@/lib/definitions/supabase"

type UserRole = Database["public"]["Enums"]["user_role"]

const AdminUpdateUserSchema = z.object({
	userId: z.string().uuid(),
	name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
	email: z.string().email("Email inválido."),
	role: z.enum(["admin", "seller", "partner", "staff"]),
	newPassword: z.string().min(8, "A senha deve ter no mínimo 8 caracteres.").optional().or(z.literal(""))
})

export async function adminUpdateUser(params: {
	userId: string
	name: string
	email: string
	role: UserRole
	newPassword?: string
}): Promise<ActionResponse<null>> {
	const supabase = await createClient()

	// Verificar se o usuário atual é admin
	const {
		data: { user: currentUser }
	} = await supabase.auth.getUser()

	if (!currentUser) {
		return { success: false, message: "Usuário não autenticado." }
	}

	const { data: currentUserData } = await supabase.from("users").select("role").eq("id", currentUser.id).single()

	if (!currentUserData || currentUserData.role !== "admin") {
		return { success: false, message: "Apenas administradores podem editar dados de outros usuários." }
	}

	// Validar dados
	const validation = AdminUpdateUserSchema.safeParse(params)
	if (!validation.success) {
		return { success: false, message: validation.error.issues.map((i) => i.message).join(", ") }
	}

	const { userId, name, email, role, newPassword } = validation.data

	try {
		const adminClient = createAdminClient()

		// 1. Buscar dados atuais do usuário para comparação
		const { data: existingUser, error: fetchError } = await adminClient.from("users").select("name, email, role").eq("id", userId).single()

		if (fetchError || !existingUser) {
			return { success: false, message: "Usuário não encontrado." }
		}

		// 2. Atualizar tabela users
		const { error: updateError } = await adminClient.from("users").update({
			name,
			email,
			role: role as UserRole
		}).eq("id", userId)

		if (updateError) {
			console.error("Erro ao atualizar usuário:", updateError)
			return { success: false, message: `Erro ao atualizar dados: ${updateError.message}` }
		}

		// 3. Atualizar tabelas de role se o nome mudou
		if (name !== existingUser.name) {
			if (role === "seller" || existingUser.role === "seller") {
				await adminClient.from("sellers").update({ name }).eq("user_id", userId)
			}
			if (role === "partner" || existingUser.role === "partner") {
				await adminClient.from("partners").update({ contact_name: name }).eq("user_id", userId)
			}
		}

		// 4. Atualizar email e/ou senha no Supabase Auth
		const authUpdate: { email?: string; password?: string } = {}
		if (email !== existingUser.email) {
			authUpdate.email = email
		}
		if (newPassword && newPassword.length >= 8) {
			authUpdate.password = newPassword
		}

		if (Object.keys(authUpdate).length > 0) {
			const { error: authError } = await adminClient.auth.admin.updateUserById(userId, authUpdate)
			if (authError) {
				console.error("Erro ao atualizar auth:", authError)
				// Reverter alterações na tabela users se auth falhar
				await adminClient.from("users").update({
					name: existingUser.name,
					email: existingUser.email,
					role: existingUser.role
				}).eq("id", userId)
				return { success: false, message: `Erro ao atualizar credenciais: ${authError.message}` }
			}
		}

		revalidatePath("/dashboard/admin/users")

		return {
			success: true,
			message: "Dados do usuário atualizados com sucesso!",
			data: null
		}
	} catch (error) {
		console.error("Erro inesperado em adminUpdateUser:", error)
		return { success: false, message: error instanceof Error ? error.message : "Ocorreu um erro inesperado." }
	}
}
