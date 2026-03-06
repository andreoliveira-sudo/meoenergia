"use server"

import type { UserPermissionDetails } from "@/lib/definitions/permissions"
import { createClient } from "@/lib/supabase/server"

/**
 * Busca todas as permissões do sistema e o status efetivo para um usuário específico.
 * Esta função chama a RPC 'get_user_permissions_detailed' no Supabase.
 *
 * @param userId O ID do usuário para o qual buscar as permissões.
 * @returns Uma Promise que resolve para um array de UserPermissionDetails ou um array vazio em caso de erro.
 */
async function getUserPermissionsDetailed(userId: string): Promise<UserPermissionDetails[]> {
	if (!userId) {
		console.error("User ID não fornecido para getUserPermissionsDetailed.")
		return []
	}

	const supabase = await createClient()

	try {
		const { data, error } = await supabase.rpc("get_user_permissions_detailed", {
			p_user_id: userId
		})

		if (error) {
			console.error("Erro ao buscar permissões detalhadas do usuário:", error)
			return []
		}

		return data as UserPermissionDetails[]
	} catch (e) {
		console.error("Erro inesperado em getUserPermissionsDetailed:", e)
		return []
	}
}

export default getUserPermissionsDetailed
