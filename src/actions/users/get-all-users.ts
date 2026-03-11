"use server"

import type { UserWithAccess } from "@/lib/definitions/users"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

async function getAllUsers(): Promise<UserWithAccess[]> {
	try {
		const supabase = await createClient()
		const { data: users, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

		if (error) {
			console.error("Erro ao buscar usuários:", error)
			return []
		}

		if (!users || users.length === 0) return []

		// Buscar status de todos os parceiros de uma vez
		const adminClient = createAdminClient()
		const partnerUserIds = users.filter(u => u.role === "partner").map(u => u.id)

		let partnersMap: Record<string, { status: string; is_active: boolean }> = {}

		if (partnerUserIds.length > 0) {
			const { data: partners } = await adminClient
				.from("partners")
				.select("user_id, status, is_active")
				.in("user_id", partnerUserIds)
				.is("deleted_at", null)

			if (partners) {
				for (const p of partners) {
					partnersMap[p.user_id] = { status: p.status, is_active: p.is_active }
				}
			}
		}

		// Mapear acesso para cada usuário
		const usersWithAccess: UserWithAccess[] = users.map(user => {
			let has_system_access = true
			let access_reason = "Liberado"

			// Verificar is_active do próprio usuário
			if (!user.is_active) {
				has_system_access = false
				access_reason = "Usuário desativado"
				return { ...user, has_system_access, access_reason }
			}

			// Para parceiros, verificar status na tabela partners
			if (user.role === "partner") {
				const partner = partnersMap[user.id]
				if (!partner) {
					has_system_access = false
					access_reason = "Sem cadastro de parceiro"
				} else if (partner.status === "pending") {
					has_system_access = false
					access_reason = "Aguardando aprovação"
				} else if (partner.status === "rejected") {
					has_system_access = false
					access_reason = "Cadastro rejeitado"
				} else if (!partner.is_active) {
					has_system_access = false
					access_reason = "Parceiro inativo"
				} else {
					access_reason = "Liberado"
				}
			}

			// Admin, staff e seller sempre têm acesso (se is_active)
			return { ...user, has_system_access, access_reason }
		})

		return usersWithAccess
	} catch (error) {
		console.error("Erro inesperado em getAllUsers:", error)
		return []
	}
}

export default getAllUsers
