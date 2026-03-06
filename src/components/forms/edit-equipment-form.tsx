"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Save } from "lucide-react"
import * as React from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { updateEquipment, getAllBrands, getEquipmentTypes } from "@/actions/equipments"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { OTHERS_TYPE_ID } from "@/lib/constants"
import { type AddEquipmentData, addEquipmentSchema } from "@/lib/validations/equipment"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import type { EquipmentWithRelations } from "@/lib/definitions/equipments"

interface EditEquipmentFormProps {
	equipment: EquipmentWithRelations
	onSuccess?: () => void
}

export function EditEquipmentForm({ equipment, onSuccess }: EditEquipmentFormProps) {
	const [isPending, startTransition] = React.useTransition()
	const queryClient = useQueryClient()

	const form = useForm<AddEquipmentData>({
		resolver: zodResolver(addEquipmentSchema),
		defaultValues: {
			name: equipment.name,
			type_id: equipment.type_id,
			brand_id: equipment.brand_id || ""
		}
	})

	const watchedTypeId = form.watch("type_id")
	const isBrandDisabled = watchedTypeId === OTHERS_TYPE_ID

	React.useEffect(() => {
		if (isBrandDisabled) {
			form.setValue("brand_id", "")
		}
	}, [isBrandDisabled, form])

	const { data: equipmentTypes, isLoading: isLoadingTypes } = useQuery({
		queryKey: ["equipmentTypes"],
		queryFn: getEquipmentTypes
	})

	const { data: brands, isLoading: isLoadingBrands } = useQuery({
		queryKey: ["brands"],
		queryFn: getAllBrands
	})

	const onSubmit = (data: AddEquipmentData) => {
		startTransition(async () => {
			const result = await updateEquipment({ equipmentId: equipment.id, data })

			if (result.success) {
				toast.success(result.message)
				queryClient.invalidateQueries({ queryKey: ["equipments"] })
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
							<FormLabel>Nome do Equipamento</FormLabel>
							<FormControl>
								<Input placeholder="Ex: Módulo Fotovoltaico 550W" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<FormField
						control={form.control}
						name="type_id"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Tipo</FormLabel>
								{isLoadingTypes ? (
									<Skeleton className="h-10 w-full" />
								) : (
									<Select onValueChange={field.onChange} value={field.value} defaultValue={field.value} disabled>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Selecione o tipo" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{equipmentTypes?.map((type) => (
												<SelectItem key={type.id} value={type.id}>
													{type.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								)}
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="brand_id"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Marca</FormLabel>
								{isLoadingBrands ? (
									<Skeleton className="h-10 w-full" />
								) : (
									<Select onValueChange={field.onChange} value={field.value} defaultValue={field.value} disabled={isBrandDisabled}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder={isBrandDisabled ? "Não aplicável" : "Selecione a marca"} />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{brands?.map((brand) => (
												<SelectItem key={brand.id} value={brand.id}>
													{brand.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								)}
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
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
