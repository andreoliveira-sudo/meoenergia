"use server"

import type { Database } from "@/lib/definitions/supabase"
import { createClient } from "@/lib/supabase/server"

type UserRole = Database["public"]["Enums"]["user_role"]

interface CurrentUser {
	id: string | null
	name: string | null
	email: string | null
	role: UserRole | null
}

/**
 * Busca os dados essenciais (id, nome, email, role) do usuário atualmente logado.
 */
async function getCurrentUser(): Promise<CurrentUser> {
	const supabase = await createClient()

	const {
		data: { user }
	} = await supabase.auth.getUser()

	if (!user) {
		return { id: null, name: null, email: null, role: null }
	}

	const email = user.email || null

	try {
		// Buscamos o perfil na nossa tabela 'users' para obter o nome e a role.
		const { data: userProfile, error: profileError } = await supabase.from("users").select("name, role").eq("id", user.id).single()

		if (profileError || !userProfile) {
			console.error("Erro ao buscar perfil do usuário:", profileError?.message)
			// Fallback para usar a primeira parte do email se o perfil não for encontrado.
			const name = user.email?.split("@")[0] || "Usuário"
			return { id: user.id, name, email, role: null }
		}

		return { id: user.id, name: userProfile.name, email, role: userProfile.role }
	} catch (e) {
		console.error("Erro inesperado ao buscar dados do usuário:", e)
		// Em caso de erro, retorna um nome padrão para não quebrar a UI.
		return { id: user.id, name: "Usuário", email, role: null }
	}
}

export default getCurrentUser
