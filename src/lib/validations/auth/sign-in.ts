import { z } from "zod"

// Schema para o formulário de login
const signInSchema = z.object({
	email: z.email("Por favor, insira um email válido."),
	password: z.string().min(1, "A senha não pode estar em branco.")
})

type SignInData = z.infer<typeof signInSchema>

export { signInSchema }
export type { SignInData }
