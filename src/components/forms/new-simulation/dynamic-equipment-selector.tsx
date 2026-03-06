// dynamic-equipment-selector.tsx
"use client"

import { useQuery } from "@tanstack/react-query"
import { useFormContext } from "react-hook-form"

import { getBrandsByEquipmentType, getEquipmentsByBrandAndType } from "@/actions/equipments"
import { CardContent } from "@/components/ui/card"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

interface DynamicEquipmentSelectProps {
	equipmentTypeId: string
	formFieldName: string
	brandIdFieldName: string
	formLabel: string
}

export function DynamicEquipmentSelect({ equipmentTypeId, formFieldName, brandIdFieldName, formLabel }: DynamicEquipmentSelectProps) {
	const { control, setValue, watch } = useFormContext()

	// Watch the brand field to trigger equipment loading
	const selectedBrandId = watch(brandIdFieldName)

	const { data: brands = [], isLoading: brandsLoading } = useQuery({
		queryKey: ["brands", equipmentTypeId],
		queryFn: () => getBrandsByEquipmentType(equipmentTypeId),
		staleTime: 5 * 60 * 1000
	})

	const hasNoBrands = !brandsLoading && brands.length === 0

	const { data: equipments = [], isLoading: equipmentsLoading } = useQuery({
		queryKey: ["equipments", equipmentTypeId, selectedBrandId],
		queryFn: () => {
			if (hasNoBrands) {
				return getEquipmentsByBrandAndType(equipmentTypeId, null)
			}
			if (!selectedBrandId) {
				return Promise.resolve([])
			}
			return getEquipmentsByBrandAndType(equipmentTypeId, selectedBrandId)
		},
		enabled: !!equipmentTypeId && (hasNoBrands || !!selectedBrandId),
		staleTime: 5 * 60 * 1000
	})

	const handleBrandChange = (brandId: string) => {
		setValue(brandIdFieldName, brandId)
		setValue(formFieldName, "") // Reset equipment when brand changes
	}

	if (brandsLoading) {
		return (
			<CardContent className="space-y-4">
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
			</CardContent>
		)
	}

	return (
		<CardContent className="space-y-4">
			{!hasNoBrands && (
				<FormField
					control={control}
					name={brandIdFieldName}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Marca</FormLabel>
							<Select
								value={field.value || ""}
								onValueChange={(value) => {
									field.onChange(value)
									handleBrandChange(value)
								}}
							>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Selecione uma marca" />
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
							<FormMessage />
						</FormItem>
					)}
				/>
			)}

			<FormField
				control={control}
				name={formFieldName}
				render={({ field }) => (
					<FormItem>
						<FormLabel>{formLabel}</FormLabel>
						{equipmentsLoading ? (
							<Skeleton className="h-10 w-full" />
						) : (
							<Select
								value={field.value || ""}
								onValueChange={field.onChange}
								disabled={equipmentsLoading || (!hasNoBrands && !selectedBrandId) || equipments.length === 0}
							>
								<FormControl>
									<SelectTrigger>
										<SelectValue
											placeholder={
												!hasNoBrands && !selectedBrandId
													? "Selecione uma marca primeiro"
													: equipments.length === 0
														? "Nenhum disponível"
														: "Selecione um equipamento"
											}
										/>
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{equipments?.map((equipment) => (
										<SelectItem key={equipment.id} value={String(equipment.id)}>
											{equipment.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
						<FormMessage />
					</FormItem>
				)}
			/>
		</CardContent>
	)
}
