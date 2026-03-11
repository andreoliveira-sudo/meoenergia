"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { Eye, EyeOff, Pencil } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { adminUpdateUser } from "@/actions/users"
import { useOperationFeedback } from "@/components/feedback/operation-feedback"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { Database } from "@/lib/definitions/supabase"
import type { User } from "@/lib/definitions/users"

type UserRole = Database["public"]["Enums"]["user_role"]

const editUserSchema = z.object({
	name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
	email: z.string().email("Email inválido."),
	role: z.enum(["admin", "seller", "partner", "staff"]),
	newPassword: z.string().min(8, "A senha deve ter no mínimo 8 caracteres.").or(z.literal("")),
	confirmPassword: z.string()
}).refine((data) => {
	if (data.newPassword && data.newPassword !== data.confirmPassword) {
		return false
	}
	return true
}, {
	message: "As senhas não coincidem.",
	path: ["confirmPassword"]
})

type EditUserData = z.infer<typeof editUserSchema>

const roleOptions: { value: UserRole; label: string }[] = [
	{ value: "admin", label: "Admin" },
	{ value: "staff", label: "Staff" },
	{ value: "seller", label: "Vendedor" },
	{ value: "partner", label: "Parceiro" }
]

interface EditUserDataDialogProps {
	user: User
}

export function EditUserDataDialog({ user }: EditUserDataDialogProps) {
	const [open, setOpen] = useState(false)
	const [showPassword, setShowPassword] = useState(false)
	const [showConfirm, setShowConfirm] = useState(false)
	const queryClient = useQueryClient()
	const { execute } = useOperationFeedback()

	const form = useForm<EditUserData>({
		resolver: zodResolver(editUserSchema),
		defaultValues: {
			name: user.name,
			email: user.email,
			role: user.role,
			newPassword: "",
			confirmPassword: ""
		}
	})

	function onSubmit(data: EditUserData) {
		execute({
			action: () => adminUpdateUser({
				userId: user.id,
				name: data.name,
				email: data.email,
				role: data.role as UserRole,
				newPassword: data.newPassword || undefined
			}),
			loadingMessage: "Atualizando dados do usuário...",
			successMessage: "Dados do usuário atualizados com sucesso!",
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ["users"] })
				form.reset({
					name: data.name,
					email: data.email,
					role: data.role,
					newPassword: "",
					confirmPassword: ""
				})
				setOpen(false)
			}
		})
	}

	return (
		<Dialog open={open} onOpenChange={(isOpen) => {
			setOpen(isOpen)
			if (!isOpen) {
				form.reset({
					name: user.name,
					email: user.email,
					role: user.role,
					newPassword: "",
					confirmPassword: ""
				})
				setShowPassword(false)
				setShowConfirm(false)
			}
		}}>
			<Tooltip>
				<TooltipTrigger asChild>
					<DialogTrigger asChild>
						<Button variant="ghost" size="icon">
							<Pencil className="size-4" />
							<span className="sr-only">Editar Dados</span>
						</Button>
					</DialogTrigger>
				</TooltipTrigger>
				<TooltipContent>
					<p>Editar Dados</p>
				</TooltipContent>
			</Tooltip>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Editar Dados do Usuário</DialogTitle>
					<DialogDescription>
						Altere os dados do usuário <span className="font-bold text-primary">{user.email}</span>. Deixe os campos de senha em branco para manter a senha atual.
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Nome Completo</FormLabel>
									<FormControl>
										<Input placeholder="Nome do usuário" {...field} />
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
										<Input type="email" placeholder="email@exemplo.com" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="role"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Função</FormLabel>
									<Select onValueChange={field.onChange} defaultValue={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Selecione a função" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{roleOptions.map((option) => (
												<SelectItem key={option.value} value={option.value}>
													{option.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<Separator />

						<div className="space-y-1">
							<p className="text-sm font-medium">Alterar Senha</p>
							<p className="text-xs text-muted-foreground">Deixe em branco para manter a senha atual.</p>
						</div>

						<FormField
							control={form.control}
							name="newPassword"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Nova Senha</FormLabel>
									<FormControl>
										<div className="relative">
											<Input
												type={showPassword ? "text" : "password"}
												placeholder="Mínimo 8 caracteres"
												{...field}
												autoComplete="new-password"
											/>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground"
												onClick={() => setShowPassword((prev) => !prev)}
											>
												{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
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
									<FormLabel>Confirmar Senha</FormLabel>
									<FormControl>
										<div className="relative">
											<Input
												type={showConfirm ? "text" : "password"}
												placeholder="Confirme a nova senha"
												{...field}
												autoComplete="new-password"
											/>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground"
												onClick={() => setShowConfirm((prev) => !prev)}
											>
												{showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
											</Button>
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="flex justify-end pt-2">
							<Button type="submit">
								Salvar Alterações
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
