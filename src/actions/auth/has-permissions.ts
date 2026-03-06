"use server"

import getUserPermissions from "@/actions/auth/get-user-permissions"
import type { PermissionId } from "@/lib/constants"

/**
 * Verifica se o usuário logado possui uma permissão específica.
 *
 * @param permissionId A permissão a ser verificada (ex: 'admin:data:manage').
 * @returns true se o usuário tiver a permissão, false caso contrário.
 */
async function hasPermission(permissionId: PermissionId): Promise<boolean> {
	const userPermissions = await getUserPermissions()
	return userPermissions.has(permissionId)
}

export default hasPermission
