"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { Eye, EyeOff, Loader2, Save } from "lucide-react"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { updateUserName, updateUserPassword } from "@/actions/users"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import type { Database } from "@/lib/definitions/supabase"
import { type UpdateUserData, updateUserSchema } from "@/lib/validations/user/my-account"

type UserRole = Database["public"]["Enums"]["user_role"]

interface MyAccountFormProps {
	user: {
		name: string
		email: string
		role: UserRole
	}
}

export function MyAccountForm({ user }: MyAccountFormProps) {
	const [isNamePending, startNameTransition] = useTransition()
	const [isPasswordPending, startPasswordTransition] = useTransition()
	const queryClient = useQueryClient()

	const [showCurrentPassword, setShowCurrentPassword] = useState(false)
	const [showNewPassword, setShowNewPassword] = useState(false)
	const [showConfirmPassword, setShowConfirmPassword] = useState(false)

	const form = useForm<UpdateUserData>({
		resolver: zodResolver(updateUserSchema),
		defaultValues: {
			name: user.name,
			email: user.email,
			currentPassword: "",
			newPassword: "",
			confirmPassword: ""
		}
	})

	const isPending = isNamePending || isPasswordPending

	function onSubmit(data: UpdateUserData) {
		const isNameChanged = data.name !== user.name
		const isPasswordChanged = !!data.newPassword

		if (isNameChanged) {
			startNameTransition(() => {
				toast.promise(updateUserName({ newName: data.name, role: user.role }), {
					loading: "Atualizando nome...",
					success: (res) => {
						if (res.success) {
							queryClient.invalidateQueries({ queryKey: ["currentUser"] })
							// Atualiza o valor padrão do formulário para o novo nome
							form.reset({ ...form.getValues(), name: data.name })
							return "Nome atualizado com sucesso!"
						}
						throw new Error(res.message)
					},
					error: (err: Error) => err.message
				})
			})
		}

		if (isPasswordChanged) {
			startPasswordTransition(() => {
				toast.promise(
					updateUserPassword({
						currentPassword: data.currentPassword!,
						newPassword: data.newPassword!
					}),
					{
						loading: "Atualizando senha...",
						success: (res) => {
							if (res.success) {
								form.reset({
									...form.getValues(),
									currentPassword: "",
									newPassword: "",
									confirmPassword: ""
								})
								return "Senha atualizada com sucesso!"
							}
							throw new Error(res.message)
						},
						error: (err: Error) => err.message
					}
				)
			})
		}
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
				<Card>
					<CardHeader>
						<CardTitle>Meus Dados</CardTitle>
						<CardDescription>Atualize seu nome de exibição.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Nome Completo</FormLabel>
									<FormControl>
										<Input placeholder="Seu nome" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input placeholder="Seu email" {...field} disabled />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Alterar Senha</CardTitle>
						<CardDescription>Para sua segurança, informe sua senha atual para realizar a alteração.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<FormField
							control={form.control}
							name="currentPassword"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Senha Atual</FormLabel>
									<FormControl>
										<div className="relative">
											<Input type={showCurrentPassword ? "text" : "password"} placeholder="Sua senha atual" {...field} autoComplete="current-password" />
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground"
												onClick={() => setShowCurrentPassword((prev) => !prev)}
											>
												{showCurrentPassword ? <EyeOff /> : <Eye />}
											</Button>
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<Separator />
						<FormField
							control={form.control}
							name="newPassword"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Nova Senha</FormLabel>
									<FormControl>
										<div className="relative">
											<Input type={showNewPassword ? "text" : "password"} placeholder="Sua nova senha" {...field} autoComplete="new-password" />
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground"
												onClick={() => setShowNewPassword((prev) => !prev)}
											>
												{showNewPassword ? <EyeOff /> : <Eye />}
											</Button>
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="confirmPassword"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Confirmar Nova Senha</FormLabel>
									<FormControl>
										<div className="relative">
											<Input type={showConfirmPassword ? "text" : "password"} placeholder="Confirme sua nova senha" {...field} autoComplete="new-password" />
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground"
												onClick={() => setShowConfirmPassword((prev) => !prev)}
											>
												{showConfirmPassword ? <EyeOff /> : <Eye />}
											</Button>
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</CardContent>
				</Card>
				<div className="flex justify-end">
					<Button type="submit" disabled={isPending}>
						{isPending ? <Loader2 className="animate-spin" /> : <Save />}
						Salvar Alterações
					</Button>
				</div>
			</form>
		</Form>
	)
}
