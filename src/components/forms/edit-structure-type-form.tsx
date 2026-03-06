"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { Loader2, Save } from "lucide-react"
import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { updateStructureType } from "@/actions/equipments"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import type { StructureType } from "@/lib/definitions/equipments"
import { addStructureTypeSchema, type AddStructureTypeData } from "@/lib/validations/structure-type"

interface EditStructureTypeFormProps {
	structureType: StructureType
	onSuccess?: () => void
}

export const EditStructureTypeForm = ({ structureType, onSuccess }: EditStructureTypeFormProps) => {
	const [isPending, startTransition] = useTransition()
	const queryClient = useQueryClient()

	const form = useForm<AddStructureTypeData>({
		resolver: zodResolver(addStructureTypeSchema),
		defaultValues: {
			name: structureType.name
		}
	})

	const onSubmit = (data: AddStructureTypeData) => {
		startTransition(async () => {
			const result = await updateStructureType({ structureTypeId: structureType.id, data })

			if (result.success) {
				toast.success(result.message)
				queryClient.invalidateQueries({ queryKey: ["structure-types"] })
				form.reset()
				onSuccess?.()
			} else {
				toast.error("Erro ao atualizar", {
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
								<Input placeholder="Ex: Laje" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
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
