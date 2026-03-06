"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { Loader2, Save } from "lucide-react"
import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { updateBrand } from "@/actions/equipments"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import type { EquipmentBrand } from "@/lib/definitions/equipments"
import { addBrandSchema, type AddBrandData } from "@/lib/validations/brand"

interface EditBrandFormProps {
	brand: EquipmentBrand
	onSuccess?: () => void
}

export const EditBrandForm = ({ brand, onSuccess }: EditBrandFormProps) => {
	const [isPending, startTransition] = useTransition()
	const queryClient = useQueryClient()

	const form = useForm<AddBrandData>({
		resolver: zodResolver(addBrandSchema),
		defaultValues: {
			name: brand.name
		}
	})

	const onSubmit = (data: AddBrandData) => {
		startTransition(async () => {
			const result = await updateBrand({ brandId: brand.id, data })

			if (result.success) {
				toast.success(result.message)
				queryClient.invalidateQueries({ queryKey: ["brands"] })
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
							<FormLabel>Nome da Marca</FormLabel>
							<FormControl>
								<Input placeholder="Ex: Intelbras" {...field} />
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
