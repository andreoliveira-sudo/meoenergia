// src/components/forms/new-simulation/step-5-documents.tsx
"use client"

import { ArrowLeft, Send } from "lucide-react"
import { useFormContext } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { FileInput } from "@/components/ui/file-input"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { documentFields } from "@/lib/constants"

interface Step5Props {
	onSubmit: () => void
	onBack: () => void
	createOrderFromSimulation?: boolean
	onToggleCreateOrderFromSimulation?: (value: boolean) => void
	showInputs?: boolean
}

export function SimulationStep5({ onSubmit, onBack, createOrderFromSimulation = false, onToggleCreateOrderFromSimulation, showInputs }: Step5Props) {
	const form = useFormContext()

	return (
		<form className="space-y-6">
			<h3 className="text-lg font-medium">Passo 5: Anexo de Documentos</h3>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{documentFields.map((doc) => (
					<FormField
						key={doc.name}
						control={form.control}
						name={doc.name}
						render={({ field }) => (
							<FormItem>
								<FormLabel>{doc.label}</FormLabel>
								<FormControl>
									<FileInput
										value={field.value}
										onChange={field.onChange}
										onRemove={() => form.setValue(doc.name, undefined, { shouldValidate: true })}
										className="w-full"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				))}
			</div>

			{showInputs && (
				<div className="pt-2">
					<div className="flex items-start space-x-3">
						<Checkbox
							id="create-order-from-simulation"
							checked={createOrderFromSimulation}
							onCheckedChange={(checked) => {
								if (onToggleCreateOrderFromSimulation) onToggleCreateOrderFromSimulation(!!checked)
							}}
						/>
						<div className="space-y-1">
							<label
								htmlFor="create-order-from-simulation"
								className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
							>
								Criar pedido a partir desta simulação
							</label>
							<p className="text-sm text-muted-foreground">Se marcado, ao salvar a simulação o sistema também criará um pedido vinculado.</p>
						</div>
					</div>
				</div>
			)}

			<div className="flex justify-between pt-8">
				<Button type="button" variant="outline" onClick={onBack}>
					<ArrowLeft className="mr-2 h-4 w-4" /> Voltar
				</Button>
				<Button type="button" onClick={onSubmit} disabled={form.formState.isSubmitting}>
					<Send className="mr-2 h-4 w-4" />
					Salvar
				</Button>
			</div>
		</form>
	)
}
