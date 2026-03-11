"use client"

import { useQueryClient } from "@tanstack/react-query"
import { Check } from "lucide-react"

import { updateSimulationStatus } from "@/actions/simulations"
import { useOperationFeedback } from "@/components/feedback/operation-feedback"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import type { SimulationStatus, SimulationWithRelations } from "@/lib/definitions/simulations"
import { cn } from "@/lib/utils"

const availableStatuses: { value: SimulationStatus; label: string }[] = [
	{ value: "initial_contact", label: "Contato Inicial" },
	{ value: "under_review", label: "Em analise Cliente" },
	{ value: "in_negotiation", label: "Em Negociacao" },
	{ value: "won", label: "Ganho" },
	{ value: "lost", label: "Perdido" }
]

interface UpdateStatusDialogProps {
	simulation: SimulationWithRelations
	open: boolean
	onOpenChange: (open: boolean) => void
}

export const UpdateStatusDialog = ({ simulation, open, onOpenChange }: UpdateStatusDialogProps) => {
	const queryClient = useQueryClient()
	const { execute } = useOperationFeedback()

	const handleStatusChange = (newStatus: SimulationStatus) => {
		if (newStatus === simulation.status) {
			onOpenChange(false)
			return
		}

		execute({
			action: () => updateSimulationStatus({ simulationId: simulation.id, status: newStatus }),
			loadingMessage: "Atualizando status...",
			successMessage: (res) => res.message,
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ["simulations"] })
				queryClient.invalidateQueries({ queryKey: ["simulation-details", simulation.id] })
				onOpenChange(false)
			}
		})
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Alterar Status da Simulacao</DialogTitle>
					<DialogDescription>Selecione o novo status para a simulacao #{simulation.kdi}.</DialogDescription>
				</DialogHeader>
				<div className="grid grid-cols-1 gap-2 py-4 sm:grid-cols-2">
					{availableStatuses.map((status) => (
						<Button
							key={status.value}
							variant="outline"
							className={cn("justify-start", simulation.status === status.value && "ring-2 ring-primary")}
							onClick={() => handleStatusChange(status.value)}
						>
							<Check className={cn("mr-2 h-4 w-4", simulation.status === status.value ? "opacity-100" : "opacity-0")} />
							{status.label}
						</Button>
					))}
				</div>
			</DialogContent>
		</Dialog>
	)
}
