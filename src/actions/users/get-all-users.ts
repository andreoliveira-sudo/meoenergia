"use server"

import type { User } from "@/lib/definitions/users"
import { createClient } from "@/lib/supabase/server"

async function getAllUsers(): Promise<User[]> {
	try {
		const supabase = await createClient()
		const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

		if (error) {
			console.error("Erro ao buscar usuários:", error)
			return []
		}

		return data || []
	} catch (error) {
		console.error("Erro inesperado em getAllUsers:", error)
		return []
	}
}

export default getAllUsers
