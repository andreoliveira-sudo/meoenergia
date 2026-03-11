"use client"

import { useQueryClient } from "@tanstack/react-query"
import { Check } from "lucide-react"

import { updateOrderStatus } from "@/actions/orders"
import { useOperationFeedback } from "@/components/feedback/operation-feedback"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { OrderStatus, OrderWithRelations } from "@/lib/definitions/orders"
import { cn } from "@/lib/utils"

const availableStatuses: { value: OrderStatus; label: string }[] = [
	{ value: "analysis_pending", label: "Ag. Análise" },
	{ value: "analysis_approved", label: "Aprovado" },
	{ value: "analysis_rejected", label: "Reprovado" },
	{ value: "documents_pending", label: "Ag. Documentos" },
	{ value: "docs_analysis", label: "Análise Docs" },
	{ value: "sending_distributor_invoice", label: "Envio NF Distribuidora" },
	{ value: "payment_distributor", label: "Pgto. Distribuidora" },
	{ value: "access_opinion", label: "Parecer de Acesso" },
	{ value: "initial_payment_integrator", label: "Pagt inicial Integrador" },
	{ value: "final_payment_integrator", label: "Pagt Final Integrador" },
	{ value: "finished", label: "Finalizado" },
	{ value: "canceled", label: "Cancelado" }
]

interface UpdateOrderStatusDialogProps {
	order: OrderWithRelations
	open: boolean
	onOpenChange: (open: boolean) => void
}

export const UpdateOrderStatusDialog = ({ order, open, onOpenChange }: UpdateOrderStatusDialogProps) => {
	const queryClient = useQueryClient()
	const { execute } = useOperationFeedback()

	const handleStatusChange = (newStatus: OrderStatus) => {
		if (newStatus === order.status) {
			onOpenChange(false)
			return
		}

		execute({
			action: () => updateOrderStatus({ orderId: order.id, status: newStatus }),
			loadingMessage: "Atualizando status...",
			successMessage: (res) => res.message,
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ["orders"] })
				queryClient.invalidateQueries({ queryKey: ["orders-paginated"] })
				queryClient.invalidateQueries({ queryKey: ["order-details", order.id] })
				queryClient.invalidateQueries({ queryKey: ["order-history", order.id] })
				queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
				onOpenChange(false)
			}
		})
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Alterar Status do Pedido</DialogTitle>
					<DialogDescription>Selecione o novo status para o pedido #{order.kdi}.</DialogDescription>
				</DialogHeader>
				<div className="grid grid-cols-1 gap-2 py-4 sm:grid-cols-2">
					{availableStatuses.map((status) => (
						<Button
							key={status.value}
							variant="outline"
							className={cn("justify-start", order.status === status.value && "ring-2 ring-primary")}
							onClick={() => handleStatusChange(status.value)}
						>
							<Check className={cn("mr-2 h-4 w-4", order.status === status.value ? "opacity-100" : "opacity-0")} />
							{status.label}
						</Button>
					))}
				</div>
			</DialogContent>
		</Dialog>
	)
}
