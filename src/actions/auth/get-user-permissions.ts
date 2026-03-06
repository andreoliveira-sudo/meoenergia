"use server"

import type { UserPermissionDetails } from "@/lib/definitions/permissions"
import { createClient } from "@/lib/supabase/server"

/**
 * Busca todas as permissões efetivas para o usuário logado.
 * Esta função chama a RPC 'get_user_permissions_detailed' no Supabase,
 * que já contém a lógica de sobreposição de permissões de role e individuais.
 *
 * @returns Um Set<string> contendo os IDs de todas as permissões que o usuário possui.
 * Retorna um Set vazio em caso de erro ou se o usuário não estiver logado.
 */
async function getUserPermissions(): Promise<Set<string>> {
	const supabase = await createClient()

	const {
		data: { user }
	} = await supabase.auth.getUser()

	if (!user) {
		return new Set()
	}

	try {
		const { data, error } = await supabase.rpc("get_user_permissions_detailed", {
			p_user_id: user.id
		})

		if (error) {
			console.error("Erro ao buscar permissões do usuário:", error)
			return new Set()
		}

		// Filtramos para garantir que apenas permissões efetivamente concedidas sejam consideradas
		// e transformamos em um Set para buscas O(1)
		const permissionsSet = new Set((data as UserPermissionDetails[]).filter((p) => p.effective).map((p) => p.permission_id))

		return permissionsSet
	} catch (e) {
		console.error("Erro inesperado em getUserPermissions:", e)
		return new Set()
	}
}

export default getUserPermissions
