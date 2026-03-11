"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, LogIn, Mail, Lock, ShieldAlert } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"

import { signIn } from "@/actions/auth"
import { forgotPassword } from "@/actions/auth/forgot-password"
import { useOperationFeedback } from "@/components/feedback/operation-feedback"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { type SignInData, signInSchema } from "@/lib/validations/auth/sign-in"

const SignInForm = () => {
	const router = useRouter()
	const { execute } = useOperationFeedback()
	const [showPassword, setShowPassword] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [forgotOpen, setForgotOpen] = useState(false)
	const [forgotEmail, setForgotEmail] = useState("")
	const [isDeactivated, setIsDeactivated] = useState(false)

	const form = useForm<SignInData>({
		resolver: zodResolver(signInSchema),
		defaultValues: {
			email: "",
			password: ""
		}
	})

	function onSubmit(data: SignInData) {
		setIsLoading(true)
		setIsDeactivated(false)

		execute({
			action: () => signIn(data),
			loadingMessage: "Autenticando...",
			successMessage: "Login realizado com sucesso!",
			errorMessage: (error) => {
				if (error.message === "USUARIO_DESATIVADO") {
					setIsDeactivated(true)
					setIsLoading(false)
					return ""
				}
				return error.message
			},
			autoCloseDuration: 1500,
			onSuccess: (result) => {
				const role = (result as any)?.data?.role
				if (role === "admin") {
					router.push("/dashboard/admin/dashboard")
				} else {
					router.push("/dashboard")
				}
			},
			onError: (error) => {
				if (error.message === "USUARIO_DESATIVADO") {
					setIsDeactivated(true)
				}
				setIsLoading(false)
			}
		})
	}

	function handleForgotPassword() {
		if (!forgotEmail || !forgotEmail.includes("@")) return

		execute({
			action: () => forgotPassword(forgotEmail),
			loadingMessage: "Enviando nova senha...",
			successMessage: (res) => res.message,
			onSuccess: () => {
				setForgotOpen(false)
				setForgotEmail("")
			}
		})
	}

	function handleOpenForgot() {
		setForgotEmail(form.getValues("email") || "")
		setForgotOpen(true)
	}

	return (
		<>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="p-6 md:p-8">
					<div className="flex flex-col gap-6">
						{/* Header */}
						<div className="flex flex-col items-center text-center">
							<div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-meo-blue to-meo-blue-dark flex items-center justify-center mb-4 shadow-lg shadow-meo-blue/25">
								<LogIn className="w-7 h-7 text-white" />
							</div>
							<h1 className="text-2xl font-bold text-meo-navy">Bem-vindo de volta</h1>
							<p className="text-meo-gray-light text-sm mt-1">
								{"Fa\u00e7a login na sua conta para continuar"}
							</p>
						</div>

						{/* Alerta de conta desativada */}
						{isDeactivated && (
							<div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
								<ShieldAlert className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
								<div>
									<p className="text-sm font-semibold text-red-800">Conta desativada</p>
									<p className="text-xs text-red-600 mt-0.5">
										Sua conta foi desativada por um administrador. Entre em contato com o suporte para mais informações.
									</p>
								</div>
							</div>
						)}

						{/* Email */}
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-meo-gray font-medium text-sm">
										Email
									</FormLabel>
									<FormControl>
										<div className="relative meo-input-glow rounded-xl transition-all">
											<Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-meo-gray-light" />
											<Input
												type="email"
												placeholder="seu@email.com"
												className="pl-10 h-12 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white transition-colors text-sm"
												disabled={isLoading}
												{...field}
											/>
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Senha */}
						<FormField
							control={form.control}
							name="password"
							render={({ field }) => (
								<FormItem>
									<div className="flex items-center justify-between">
										<FormLabel className="text-meo-gray font-medium text-sm">
											Senha
										</FormLabel>
										<button
											type="button"
											className="text-xs text-meo-blue hover:text-meo-blue-dark transition-colors font-medium"
											tabIndex={-1}
											onClick={handleOpenForgot}
										>
											Esqueceu a senha?
										</button>
									</div>
									<FormControl>
										<div className="relative meo-input-glow rounded-xl transition-all">
											<Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-meo-gray-light" />
											<Input
												type={showPassword ? "text" : "password"}
												placeholder="Digite sua senha"
												className="pl-10 pr-10 h-12 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white transition-colors text-sm"
												disabled={isLoading}
												{...field}
											/>
											<button
												type="button"
												onClick={() => setShowPassword(!showPassword)}
												className="absolute right-3.5 top-1/2 -translate-y-1/2 text-meo-gray-light hover:text-meo-gray transition-colors"
												tabIndex={-1}
											>
												{showPassword ? (
													<EyeOff className="w-4 h-4" />
												) : (
													<Eye className="w-4 h-4" />
												)}
											</button>
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Botao de login */}
						<Button
							type="submit"
							className="w-full h-12 rounded-xl text-white font-semibold text-sm meo-btn-gradient border-0 shadow-lg"
							disabled={isLoading}
						>
							{isLoading ? (
								<div className="flex items-center gap-2">
									<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
									<span>Entrando...</span>
								</div>
							) : (
								<div className="flex items-center gap-2">
									<span>Entrar</span>
									<LogIn className="w-4 h-4" />
								</div>
							)}
						</Button>
					</div>
				</form>
			</Form>

			{/* Dialog Recuperar Senha */}
			<Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
				<DialogContent className="sm:max-w-[420px]">
					<DialogHeader>
						<DialogTitle>Recuperar Senha</DialogTitle>
						<DialogDescription>
							Informe seu email cadastrado. Uma nova senha será gerada e enviada para sua caixa de entrada.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-2">
						<div className="space-y-2">
							<label className="text-sm font-medium text-foreground">Email</label>
							<div className="relative">
								<Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
								<Input
									type="email"
									placeholder="seu@email.com"
									className="pl-10 h-11"
									value={forgotEmail}
									onChange={(e) => setForgotEmail(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											e.preventDefault()
											handleForgotPassword()
										}
									}}
								/>
							</div>
						</div>
					</div>
					<DialogFooter className="gap-2 sm:gap-0">
						<Button variant="outline" onClick={() => setForgotOpen(false)}>
							Cancelar
						</Button>
						<Button
							onClick={handleForgotPassword}
							disabled={!forgotEmail || !forgotEmail.includes("@")}
						>
							<Mail className="mr-2 size-4" />
							Enviar Nova Senha
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}

export { SignInForm }
