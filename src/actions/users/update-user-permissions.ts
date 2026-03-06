"use server"

import { revalidatePath } from "next/cache"

import type { PermissionId } from "@/lib/constants"
import { createAdminClient } from "@/lib/supabase/admin"
import type { ActionResponse } from "@/types/action-response"

interface UpdateUserPermissionsParams {
	userId: string
	permissions: Record<PermissionId, boolean>
}

async function updateUserPermissions({ userId, permissions }: UpdateUserPermissionsParams): Promise<ActionResponse<null>> {
	if (!userId) {
		return { success: false, message: "ID do usuário não fornecido." }
	}

	try {
		const supabase = createAdminClient()

		const permissionsToUpsert = Object.entries(permissions).map(([permission_id, has_permission]) => ({
			user_id: userId,
			permission_id,
			has_permission
		}))

		const { error } = await supabase.from("user_permissions").upsert(permissionsToUpsert, {
			onConflict: "user_id, permission_id"
		})

		if (error) {
			console.error("Erro ao atualizar permissões (Supabase):", error)
			return {
				success: false,
				message: "Erro ao atualizar as permissões. Por favor, tente novamente."
			}
		}

		revalidatePath("/dashboard/admin/users")

		return {
			success: true,
			message: "Permissões atualizadas com sucesso!",
			data: null
		}
	} catch (e) {
		console.error("Erro inesperado em updateUserPermissions:", e)
		const errorMessage = e instanceof Error ? e.message : "Ocorreu um erro desconhecido."
		return {
			success: false,
			message: `Ocorreu um erro inesperado: ${errorMessage}`
		}
	}
}

export default updateUserPermissions