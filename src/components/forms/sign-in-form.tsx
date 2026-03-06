"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { signIn } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { type SignInData, signInSchema } from "@/lib/validations/auth/sign-in"

const SignInForm = () => {
	const router = useRouter()
	const [isPending, startTransition] = useTransition()

	const form = useForm<SignInData>({
		resolver: zodResolver(signInSchema),
		defaultValues: {
			email: "",
			password: ""
		}
	})

	function onSubmit(data: SignInData) {
		startTransition(async () => {
			const result = await signIn(data)
			if (result.success) {
				toast.success("Login realizado com sucesso!")
				router.push("/dashboard") // Redireciona para a página principal após o login
			} else {
				toast.error("Erro no Login", {
					description: result.message
				})
			}
		})
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="p-6 md:p-8">
				<div className="flex flex-col gap-6">
					<div className="flex flex-col items-center text-center">
						<h1 className="text-2xl font-bold">Bem-vindo de volta</h1>
						<p className="text-muted-foreground text-balance">Faça login na sua conta para continuar.</p>
					</div>
					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Email</FormLabel>
								<FormControl>
									<Input type="email" placeholder="email@exemplo.com" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="password"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Senha</FormLabel>
								<FormControl>
									<Input type="password" placeholder="********" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<Button type="submit" className="w-full" disabled={isPending}>
						{isPending ? "Entrando..." : "Entrar"}
					</Button>
				</div>
			</form>
		</Form>
	)
}

export { SignInForm }
