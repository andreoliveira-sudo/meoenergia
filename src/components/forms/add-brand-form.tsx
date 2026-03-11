"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { Loader2, Save } from "lucide-react"
import { useTransition } from "react"
import { useForm } from "react-hook-form"

import { createBrand } from "@/actions/equipments"
import { useOperationFeedback } from "@/components/feedback/operation-feedback"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { type AddBrandData, addBrandSchema } from "@/lib/validations/brand"

interface AddBrandFormProps {
	onSuccess?: () => void
}

const AddBrandForm = ({ onSuccess }: AddBrandFormProps) => {
	const [isPending, startTransition] = useTransition()
	const queryClient = useQueryClient()
	const { execute } = useOperationFeedback()

	const form = useForm<AddBrandData>({
		resolver: zodResolver(addBrandSchema),
		defaultValues: {
			name: ""
		}
	})

	const onSubmit = (data: AddBrandData) => {
		startTransition(() => {
			execute({
				action: () => createBrand(data.name),
				loadingMessage: "Salvando marca...",
				successMessage: (res) => res.message,
				onSuccess: () => {
					queryClient.invalidateQueries({ queryKey: ["brands"] })
					form.reset()
					onSuccess?.()
				}
			})
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
						Salvar
					</Button>
				</div>
			</form>
		</Form>
	)
}

export { AddBrandForm }
