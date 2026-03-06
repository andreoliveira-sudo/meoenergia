"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"
import type { ActionResponse } from "@/types/action-response"

const UpdatePasswordSchema = z.object({
	currentPassword: z.string().min(1, "Senha atual é obrigatória."),
	newPassword: z.string().min(8, "A nova senha deve ter no mínimo 8 caracteres.")
})

export default async function updateUserPassword({ currentPassword, newPassword }: z.infer<typeof UpdatePasswordSchema>): Promise<ActionResponse<null>> {
	const supabase = await createClient()

	const validation = UpdatePasswordSchema.safeParse({ currentPassword, newPassword })
	if (!validation.success) {
		return { success: false, message: validation.error.issues.map((i) => i.message).join(", ") }
	}

	try {
		// 1. Obter o usuário logado para pegar o email
		const {
			data: { user }
		} = await supabase.auth.getUser()
		if (!user || !user.email) {
			return { success: false, message: "Usuário não encontrado ou sem email." }
		}

		// 2. Re-autenticar com a senha atual para verificar.
		// Esta é uma etapa de segurança CRUCIAL.
		const { error: signInError } = await supabase.auth.signInWithPassword({
			email: user.email,
			password: currentPassword
		})

		if (signInError) {
			console.error("Falha na re-autenticação:", signInError.message)
			return { success: false, message: "A senha atual está incorreta." }
		}

		// 3. Se a re-autenticação passou, atualizar a senha do usuário.
		const { error: updateError } = await supabase.auth.updateUser({
			password: newPassword
		})

		if (updateError) {
			console.error("Erro ao atualizar senha:", updateError.message)
			return { success: false, message: "Não foi possível atualizar a senha. Tente novamente." }
		}

		// 4. Revalida o caminho para garantir que a UI reflita o estado mais recente
		revalidatePath("/dashboard/my-account")

		return {
			success: true,
			message: "Senha atualizada com sucesso!",
			data: null
		}
	} catch (error) {
		console.error("Erro inesperado em updateUserPassword:", error)
		const message = error instanceof Error ? error.message : "Ocorreu um erro desconhecido no servidor."
		return { success: false, message }
	}
}
