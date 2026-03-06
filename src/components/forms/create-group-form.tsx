"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { Loader2, Save } from "lucide-react"
import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { createGroupAction } from "@/actions/groups"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createGroupSchema, type CreateGroupSchema } from "@/lib/validations/create-group"

interface CreateGroupFormProps {
	onSuccess?: () => void
}

export const CreateGroupForm = ({ onSuccess }: CreateGroupFormProps) => {
	const [isPending, startTransition] = useTransition()
	const queryClient = useQueryClient()

	const form = useForm<CreateGroupSchema>({
		resolver: zodResolver(createGroupSchema),
		defaultValues: {
			name: "",
			description: ""
		}
	})

	const handleSubmit = (data: CreateGroupSchema) => {
		startTransition(async () => {
			const result = await createGroupAction({
				name: data.name,
				description: data.description?.trim() ? data.description : undefined
			})

			if (result.success) {
				toast.success(result.message)
				queryClient.invalidateQueries({ queryKey: ["groups"] })
				form.reset({
					name: "",
					description: ""
				})
				onSuccess?.()
			} else {
				toast.error("Erro ao criar grupo", {
					description: result.message
				})
			}
		})
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
				<div className="grid gap-4">
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Nome do grupo</FormLabel>
								<FormControl>
									<Input placeholder="Ex: Equipe Financeira" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="description"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Descrição</FormLabel>
								<FormControl>
									<Textarea placeholder="Adicione detalhes sobre o grupo (opcional)" rows={4} {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<div className="flex justify-end">
					<Button type="submit" disabled={isPending}>
						{isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
						Criar grupo
					</Button>
				</div>
			</form>
		</Form>
	)
}
