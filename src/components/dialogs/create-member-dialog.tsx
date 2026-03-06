"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, UserPlus } from "lucide-react"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { addGroupMemberAction } from "@/actions/groups"
import getAllUsersAction from "@/actions/users/get-all-users-action"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type CreateMemberSchema, createMemberSchema } from "@/lib/validations/create-group-member"

type CreateMemberDialogProps = {
	groupId: string
}

type UserOption = {
	id: string
	name: string
	email: string
}

const roleOptions: { value: string; label: string }[] = [
	{ value: "admin", label: "Administrador" },
	{ value: "member", label: "Membro" },
	{ value: "viewer", label: "Visualizador" }
]

export const CreateMemberDialog = ({ groupId }: CreateMemberDialogProps) => {
	const [open, setOpen] = useState(false)
	const [isPending, startTransition] = useTransition()
	const queryClient = useQueryClient()

	const form = useForm<CreateMemberSchema>({
		resolver: zodResolver(createMemberSchema),
		defaultValues: {
			user_id: "",
			role: ""
		}
	})

	const { data: users, isLoading: isLoadingUsers } = useQuery<UserOption[]>({
		queryKey: ["users"],
		queryFn: async () => {
			const response = await getAllUsersAction()
			if (!response.success) {
				throw new Error(response.message)
			}
			return response.data
		},
		retry: false
	})

	const resetForm = () =>
		form.reset({
			user_id: "",
			role: ""
		})

	const handleOpenChange = (nextOpen: boolean) => {
		setOpen(nextOpen)
		if (!nextOpen) {
			resetForm()
		}
	}

	const onSubmit = (values: CreateMemberSchema) => {
		startTransition(async () => {
			const result = await addGroupMemberAction({
				groupId,
				userId: values.user_id,
				role: values.role
			})

			if (result.success) {
				toast.success("Membro adicionado com sucesso")
				await queryClient.invalidateQueries({ queryKey: ["group-members", groupId] })
				handleOpenChange(false)
			} else {
				toast.error("Erro ao adicionar membro", {
					description: result.message
				})
			}
		})
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<Button>
					<UserPlus className="mr-2 h-4 w-4" />
					Adicionar Membro
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Adicionar novo membro</DialogTitle>
					<DialogDescription>Selecione o usuario e defina o papel dentro do grupo.</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="user_id"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Usuario</FormLabel>
									<FormControl>
										<Select onValueChange={field.onChange} value={field.value || undefined} disabled={isPending || isLoadingUsers}>
											<SelectTrigger>
												<SelectValue placeholder={isLoadingUsers ? "Carregando usuarios..." : "Selecione um usuario"} />
											</SelectTrigger>
											<SelectContent>
												{isLoadingUsers ? (
													<SelectItem value="loading" disabled>
														Carregando usuarios...
													</SelectItem>
												) : users && users.length > 0 ? (
													users.map((user) => (
														<SelectItem key={user.id} value={user.id}>
															<div className="flex gap-2">
																<span className="font-medium">{user.name} -</span>
																<span className="text-xs text-muted-foreground">{user.email}</span>
															</div>
														</SelectItem>
													))
												) : (
													<SelectItem value="empty" disabled>
														Nenhum usuario disponivel
													</SelectItem>
												)}
											</SelectContent>
										</Select>
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
									<FormLabel>Papel</FormLabel>
									<FormControl>
										<Select onValueChange={field.onChange} value={field.value || undefined} disabled={isPending}>
											<SelectTrigger>
												<SelectValue placeholder="Selecione o papel" />
											</SelectTrigger>
											<SelectContent>
												{roleOptions.map((option) => (
													<SelectItem key={option.value} value={option.value}>
														{option.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<DialogFooter className="pt-2">
							<Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
								Cancelar
							</Button>
							<Button type="submit" disabled={isPending}>
								{isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
								Adicionar
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
