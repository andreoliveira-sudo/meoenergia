"use server"

import { revalidatePath } from "next/cache"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import type { ActionResponse } from "@/types/action-response"

export async function toggleUserStatus(params: {
	userId: string
	isActive: boolean
}): Promise<ActionResponse<null>> {
	const supabase = await createClient()

	// Verificar se o usuário atual é admin
	const {
		data: { user: currentUser }
	} = await supabase.auth.getUser()

	if (!currentUser) {
		return { success: false, message: "Usuário não autenticado." }
	}

	// Não permitir desativar a si mesmo
	if (currentUser.id === params.userId && !params.isActive) {
		return { success: false, message: "Você não pode desativar sua própria conta." }
	}

	const { data: currentUserData } = await supabase.from("users").select("role").eq("id", currentUser.id).single()

	if (!currentUserData || currentUserData.role !== "admin") {
		return { success: false, message: "Apenas administradores podem ativar/desativar usuários." }
	}

	try {
		const adminClient = createAdminClient()

		// Buscar dados do usuário alvo
		const { data: targetUser, error: fetchError } = await adminClient
			.from("users")
			.select("name, email, role")
			.eq("id", params.userId)
			.single()

		if (fetchError || !targetUser) {
			return { success: false, message: "Usuário não encontrado." }
		}

		// Não permitir desativar admins (proteção extra)
		if (targetUser.role === "admin" && !params.isActive) {
			return { success: false, message: "Não é permitido desativar contas de administrador." }
		}

		// Atualizar status
		const { error: updateError } = await adminClient
			.from("users")
			.update({
				is_active: params.isActive,
				updated_at: new Date().toISOString()
			})
			.eq("id", params.userId)

		if (updateError) {
			console.error("Erro ao atualizar status do usuário:", updateError)
			return { success: false, message: `Erro ao atualizar status: ${updateError.message}` }
		}

		revalidatePath("/dashboard/admin/users")

		const statusText = params.isActive ? "ativado" : "desativado"
		return {
			success: true,
			message: `Usuário ${targetUser.name} foi ${statusText} com sucesso!`,
			data: null
		}
	} catch (error) {
		console.error("Erro inesperado em toggleUserStatus:", error)
		return { success: false, message: error instanceof Error ? error.message : "Ocorreu um erro inesperado." }
	}
}
