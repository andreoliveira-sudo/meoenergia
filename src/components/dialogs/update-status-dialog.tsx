"use client"

import { useQueryClient } from "@tanstack/react-query"
import { Check, Loader2 } from "lucide-react"
import { useTransition } from "react"
import { toast } from "sonner"

import { updateSimulationStatus } from "@/actions/simulations"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import type { SimulationStatus, SimulationWithRelations } from "@/lib/definitions/simulations"
import { cn } from "@/lib/utils"

const availableStatuses: { value: SimulationStatus; label: string }[] = [
	{ value: "initial_contact", label: "Contato Inicial" },
	{ value: "under_review", label: "Em análise Cliente" },
	{ value: "in_negotiation", label: "Em Negociação" },
	{ value: "won", label: "Ganho" },
	{ value: "lost", label: "Perdido" }
]

interface UpdateStatusDialogProps {
	simulation: SimulationWithRelations
	open: boolean
	onOpenChange: (open: boolean) => void
}

export const UpdateStatusDialog = ({ simulation, open, onOpenChange }: UpdateStatusDialogProps) => {
	const [isPending, startTransition] = useTransition()
	const queryClient = useQueryClient()

	const handleStatusChange = (newStatus: SimulationStatus) => {
		if (newStatus === simulation.status) {
			onOpenChange(false)
			return
		}

		startTransition(() => {
			toast.promise(updateSimulationStatus({ simulationId: simulation.id, status: newStatus }), {
				loading: "Atualizando status...",
				success: (res) => {
					if (res.success) {
						queryClient.invalidateQueries({ queryKey: ["simulations"] })
						onOpenChange(false)
						return res.message
					}
					throw new Error(res.message)
				},
				error: (err: Error) => {
					return err.message || "Ocorreu um erro inesperado."
				}
			})
		})
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Alterar Status da Simulação</DialogTitle>
					<DialogDescription>Selecione o novo status para a simulação #{simulation.kdi}.</DialogDescription>
				</DialogHeader>
				<div className="grid grid-cols-1 gap-2 py-4 sm:grid-cols-2">
					{availableStatuses.map((status) => (
						<Button
							key={status.value}
							variant="outline"
							className={cn("justify-start", simulation.status === status.value && "ring-2 ring-primary")}
							onClick={() => handleStatusChange(status.value)}
							disabled={isPending}
						>
							{isPending ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<Check className={cn("mr-2 h-4 w-4", simulation.status === status.value ? "opacity-100" : "opacity-0")} />
							)}
							{status.label}
						</Button>
					))}
				</div>
			</DialogContent>
		</Dialog>
	)
}
