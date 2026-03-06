"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

async function signOut() {
	const supabase = await createClient()
	const { error } = await supabase.auth.signOut()

	if (error) {
		console.error("Erro ao fazer logout:", error)
	}

	// Força a limpeza do cache de rotas para garantir que o estado de autenticação seja atualizado
	revalidatePath("/", "layout")
	redirect("/")
}

export default signOut
