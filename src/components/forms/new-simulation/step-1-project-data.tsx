/** biome-ignore-all lint/suspicious/noArrayIndexKey: <dont need this> */
"use client"

import { useQuery } from "@tanstack/react-query"
import { ArrowRight, X } from "lucide-react"
import { useFormContext } from "react-hook-form"

import { getStructureTypes } from "@/actions/equipments"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { connectionVoltageTypes, energyProviders, INVERTER_TYPE_ID, MODULE_TYPE_ID, OTHERS_TYPE_ID } from "@/lib/constants"
import { maskNumber } from "@/lib/masks"
import { DynamicEquipmentSelect } from "./dynamic-equipment-selector"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface Step1Props {
	onNext: () => void
}

const SimulationStep1 = ({ onNext }: Step1Props) => {
	const form = useFormContext()

	const { data: structureTypes, isLoading: isLoadingStructureTypes } = useQuery({
		queryKey: ["structureTypes"],
		queryFn: getStructureTypes
	})

	const handleNext = (e: React.MouseEvent) => {
		e.preventDefault()
		onNext()
	}

	const handleClearOthers = () => {
		form.setValue("kit_others", "")
		form.setValue("kit_others_brand_id", "")
	}

	return (
		<form className="space-y-6">
			<h3 className="text-lg font-medium">Passo 1: Dados do Projeto</h3>
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				<FormField
					control={form.control}
					name="systemPower"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Potência (kWp) *</FormLabel>
							<FormControl>
								<Input type="text" placeholder="9.999,99" {...field} onChange={(e) => field.onChange(maskNumber(e.target.value, 9))} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="currentConsumption"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Consumo Atual (kWh) *</FormLabel>
							<FormControl>
								<Input type="text" placeholder="9.999,99" {...field} onChange={(e) => field.onChange(maskNumber(e.target.value, 9))} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>
			<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
				<FormField
					control={form.control}
					name="energyProvider"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Concessionária *</FormLabel>
							<Select onValueChange={field.onChange} value={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Selecione a concessionária" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{energyProviders.map((provider, index) => (
										<SelectItem key={`${provider}-${index}`} value={provider}>
											{provider}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="structureType"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Tipo de Estrutura *</FormLabel>
							{isLoadingStructureTypes ? (
								<Skeleton className="h-10 w-full" />
							) : (
								<Select onValueChange={field.onChange} value={field.value} disabled={isLoadingStructureTypes}>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder={isLoadingStructureTypes ? "Carregando..." : "Selecione o tipo"} />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{structureTypes?.map((type) => (
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
					name="connectionVoltage"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Conexão e Tensão *</FormLabel>
							<Select onValueChange={field.onChange} value={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Selecione o tipo de conexão" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{connectionVoltageTypes.map((type, index) => (
										<SelectItem key={`${type}-${index}`} value={type}>
											{type}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>

			<Separator className="my-8" />

			<div className="space-y-2">
				<h3 className="text-lg font-medium">Kit de Equipamentos</h3>
				<p className="text-sm text-muted-foreground">Selecione os equipamentos para a simulação.</p>
			</div>

			<div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Módulos</CardTitle>
					</CardHeader>
					<DynamicEquipmentSelect equipmentTypeId={MODULE_TYPE_ID} formFieldName="kit_module" brandIdFieldName="kit_module_brand_id" formLabel="Módulo *" />
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Inversores</CardTitle>
					</CardHeader>
					<DynamicEquipmentSelect
						equipmentTypeId={INVERTER_TYPE_ID}
						formFieldName="kit_inverter"
						brandIdFieldName="kit_inverter_brand_id"
						formLabel="Inversor *"
					/>
				</Card>
				<Card>
					<CardHeader>
						<div className="flex justify-between items-center">
							<CardTitle className="text-lg">Outros</CardTitle>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={handleClearOthers}>
										<X className="h-4 w-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Limpar seleção</TooltipContent>
							</Tooltip>
						</div>
					</CardHeader>
					<DynamicEquipmentSelect equipmentTypeId={OTHERS_TYPE_ID} formFieldName="kit_others" brandIdFieldName="kit_others_brand_id" formLabel="Outros" />
				</Card>
			</div>

			<div className="flex justify-end pt-8">
				<Button type="button" onClick={handleNext}>
					Próximo <ArrowRight className="ml-2 h-4 w-4" />
				</Button>
			</div>
		</form>
	)
}

export { SimulationStep1 }
