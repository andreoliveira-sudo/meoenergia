"use client"

import { ArrowLeft, Send } from "lucide-react"
import { useFormContext } from "react-hook-form"
import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { OrderDocumentsTab } from "@/components/orders/order-documents-tab"

interface Step5Props {
	onSubmit: () => void
	onBack: () => void
	createOrderFromSimulation?: boolean
	onToggleCreateOrderFromSimulation?: (value: boolean) => void
	showInputs?: boolean
	orderId?: string
}

export function SimulationStep5({
	onSubmit,
	onBack,
	createOrderFromSimulation = false,
	onToggleCreateOrderFromSimulation,
	showInputs,
	orderId,
}: Step5Props) {
	const form = useFormContext()

	const [mounted, setMounted] = useState(false)
	useEffect(() => {
		setMounted(true)
	}, [])

	const customerType = form.watch("type")
	const isPF = mounted ? customerType === "pf" : false

	return (
		<div className="space-y-6">
			<div className="space-y-1">
				<h3 className="text-lg font-medium">Passo 5: Anexo de Documentos</h3>
				{mounted && (
					<p className="text-sm text-muted-foreground">
						{isPF
							? "Documentos necessarios para Pessoa Fisica."
							: "Documentos necessarios para Pessoa Juridica."}
					</p>
				)}
			</div>

			{orderId ? (
				<OrderDocumentsTab
					orderId={orderId}
					customerType={isPF ? "pf" : "pj"}
					isAdmin={true}
				/>
			) : (
				<div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-xs text-amber-700">
					Salve o pedido primeiro (botao Salvar) para poder anexar documentos.
				</div>
			)}

			{showInputs && (
				<div className="pt-2">
					<div className="flex items-start space-x-3">
						<Checkbox
							id="create-order-from-simulation"
							checked={createOrderFromSimulation}
							onCheckedChange={(checked) => {
								if (onToggleCreateOrderFromSimulation)
									onToggleCreateOrderFromSimulation(!!checked)
							}}
						/>
						<div className="space-y-1">
							<label
								htmlFor="create-order-from-simulation"
								className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
							>
								Criar pedido a partir desta simulacao
							</label>
							<p className="text-sm text-muted-foreground">
								Se marcado, ao salvar a simulacao o sistema tambem criara um pedido vinculado.
							</p>
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
		</div>
	)
}
