"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { Loader2, Save } from "lucide-react"
import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { createStructureType } from "@/actions/equipments"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { type AddStructureTypeData, addStructureTypeSchema } from "@/lib/validations/structure-type"

interface AddStructureTypeFormProps {
	onSuccess?: () => void
}

export function AddStructureTypeForm({ onSuccess }: AddStructureTypeFormProps) {
	const [isPending, startTransition] = useTransition()
	const queryClient = useQueryClient()

	const form = useForm<AddStructureTypeData>({
		resolver: zodResolver(addStructureTypeSchema),
		defaultValues: {
			name: ""
		}
	})

	const onSubmit = (data: AddStructureTypeData) => {
		startTransition(async () => {
			const result = await createStructureType(data.name)

			if (result.success) {
				toast.success(result.message)
				queryClient.invalidateQueries({ queryKey: ["structure-types"] })
				form.reset()
				if (onSuccess) {
					onSuccess()
				}
			} else {
				toast.error("Erro ao adicionar", {
					description: result.message
				})
			}
		})
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Nome do Tipo de Estrutura</FormLabel>
							<FormControl>
								<Input placeholder="Ex: Metálico" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<div className="flex justify-end">
					<Button type="submit" disabled={isPending}>
						{isPending ? <Loader2 className="animate-spin" /> : <Save />}
						Salvar
					</Button>
				</div>
			</form>
		</Form>
	)
}
