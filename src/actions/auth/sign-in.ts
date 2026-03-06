"use server"

import { isAuthApiError } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/server"
import type { SignInData } from "@/lib/validations/auth/sign-in"
import type { ActionResponse } from "@/types/action-response"

async function signIn(credentials: SignInData): Promise<ActionResponse<{ userId: string }>> {
	const supabase = await createClient()

	const { data, error } = await supabase.auth.signInWithPassword({
		email: credentials.email,
		password: credentials.password
	})

	if (error) {
		console.error("Erro de login (Supabase):", error)
		if (isAuthApiError(error)) {
			return { success: false, message: "Credenciais inválidas. Verifique seu email e senha." }
		}
		return { success: false, message: "Ocorreu um erro inesperado. Tente novamente." }
	}

	if (data.user) {
		return {
			success: true,
			message: "Login bem-sucedido!",
			data: {
				userId: data.user.id
			}
		}
	}

	return { success: false, message: "Não foi possível autenticar o usuário." }
}

export default signIn
