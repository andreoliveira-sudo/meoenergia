"use server"

import { isAuthApiError } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/server"
import type { SignInData } from "@/lib/validations/auth/sign-in"
import type { ActionResponse } from "@/types/action-response"

async function signIn(credentials: SignInData): Promise<ActionResponse<{ userId: string; role: string | null }>> {
	try {
		const supabase = await createClient()

		const { data, error } = await supabase.auth.signInWithPassword({
			email: credentials.email,
			password: credentials.password
		})

		if (error) {
			console.error("Erro de login (Supabase):", error)

			if (isAuthApiError(error)) {
				const status = error.status

				if (status === 400) {
					return {
						success: false,
						message: "Email ou senha incorretos. Verifique suas credenciais e tente novamente."
					}
				}

				if (status === 422) {
					return {
						success: false,
						message: "Dados de login inv\u00e1lidos. Verifique o formato do email e tente novamente."
					}
				}

				if (status === 429) {
					return {
						success: false,
						message: "Muitas tentativas de login. Aguarde alguns minutos e tente novamente."
					}
				}

				return {
					success: false,
					message: "Credenciais inv\u00e1lidas. Verifique seu email e senha."
				}
			}

			return {
				success: false,
				message: "Ocorreu um erro inesperado no servidor. Tente novamente mais tarde."
			}
		}

		if (data.user) {
			// Buscar role e status do usuario
			let role: string | null = null
			let isActive = true
			try {
				const { data: profile } = await supabase
					.from("users")
					.select("role, is_active")
					.eq("id", data.user.id)
					.single()
				role = profile?.role ?? null
				isActive = profile?.is_active ?? true
			} catch {
				// Ignora erro ao buscar role - redirect padrao
			}

			// Verificar se o usuário está desativado
			if (!isActive) {
				// Fazer logout do usuário desativado
				await supabase.auth.signOut()
				return {
					success: false,
					message: "USUARIO_DESATIVADO"
				}
			}

			return {
				success: true,
				message: "Login realizado com sucesso!",
				data: {
					userId: data.user.id,
					role
				}
			}
		}

		return { success: false, message: "N\u00e3o foi poss\u00edvel autenticar o usu\u00e1rio. Tente novamente." }
	} catch (error) {
		console.error("Erro de conex\u00e3o no login:", error)

		if (error instanceof TypeError && error.message.includes("fetch")) {
			return {
				success: false,
				message: "Falha de conex\u00e3o com o servidor. Verifique sua internet e tente novamente."
			}
		}

		return {
			success: false,
			message: "Erro de comunica\u00e7\u00e3o com o servidor. Verifique sua conex\u00e3o e tente novamente."
		}
	}
}

export default signIn
