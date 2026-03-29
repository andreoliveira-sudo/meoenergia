"use client"

import { useQueryClient } from "@tanstack/react-query"
import { Check } from "lucide-react"

import { updateOrderStatus } from "@/actions/orders"
import { updateOrderWorkflowStatus } from "@/actions/orders/update-order-workflow-status"
import { useOperationFeedback } from "@/components/feedback/operation-feedback"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { OrderStatus, OrderWorkflowStatus, OrderWithRelations } from "@/lib/definitions/orders"
import { cn } from "@/lib/utils"

const creditStatuses: { value: OrderStatus; label: string }[] = [
	{ value: "analysis_pending", label: "Ag. Análise" },
	{ value: "analysis_approved", label: "Aprovado" },
	{ value: "analysis_rejected", label: "Reprovado" },
]

const workflowStatuses: { value: OrderWorkflowStatus; label: string }[] = [
	{ value: "in_review", label: "Em revisão" },
	{ value: "rejected", label: "Cancelado" },
	{ value: "documents_pending", label: "Ag. Documentos" },
	{ value: "docs_analysis", label: "Analisando Docs" },
	{ value: "documents_issue", label: "Pendência documentos" },
	{ value: "awaiting_signature", label: "Aguardando assinatura" },
	{ value: "awaiting_distributor_docs", label: "Aguardando docs distribuidor" },
	{ value: "analyzing_distributor_docs", label: "Analisando docs distribuidor" },
	{ value: "distributor_docs_issue", label: "Pendência docs distribuidor" },
	{ value: "equipment_separation", label: "Equipamentos em Separação" },
	{ value: "equipment_transit", label: "Equipamentos em Trânsito" },
	{ value: "equipment_delivered", label: "Equipamento entregue" },
	{ value: "awaiting_integrator_docs", label: "Aguardando docs integrador" },
	{ value: "analyzing_integrator_docs", label: "Analisando docs integrador" },
	{ value: "integrator_docs_issue", label: "Pendência docs integrador" },
]

interface UpdateOrderStatusDialogProps {
	order: OrderWithRelations
	open: boolean
	onOpenChange: (open: boolean) => void
}

export const UpdateOrderStatusDialog = ({ order, open, onOpenChange }: UpdateOrderStatusDialogProps) => {
	const queryClient = useQueryClient()
	const { execute } = useOperationFeedback()

	const invalidateAll = () => {
		queryClient.invalidateQueries({ queryKey: ["orders"] })
		queryClient.invalidateQueries({ queryKey: ["orders-paginated"] })
		queryClient.invalidateQueries({ queryKey: ["order-details", order.id] })
		queryClient.invalidateQueries({ queryKey: ["order-history", order.id] })
		queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
	}

	const handleCreditStatusChange = (newStatus: OrderStatus) => {
		if (newStatus === order.status) {
			onOpenChange(false)
			return
		}

		execute({
			action: () => updateOrderStatus({ orderId: order.id, status: newStatus }),
			loadingMessage: "Atualizando status de crédito...",
			successMessage: (res) => res.message,
			onSuccess: () => {
				invalidateAll()
				onOpenChange(false)
			}
		})
	}

	const handleWorkflowStatusChange = (newStatus: OrderWorkflowStatus) => {
		if (newStatus === order.order_status) {
			onOpenChange(false)
			return
		}

		execute({
			action: () => updateOrderWorkflowStatus({ orderId: order.id, orderStatus: newStatus }),
			loadingMessage: "Atualizando status do pedido...",
			successMessage: (res) => res.message,
			onSuccess: () => {
				invalidateAll()
				onOpenChange(false)
			}
		})
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Alterar Status — Pedido #{order.kdi}</DialogTitle>
					<DialogDescription>Selecione o status de crédito ou do pedido.</DialogDescription>
				</DialogHeader>

				{/* Seção: Status de Crédito */}
				<div className="space-y-2">
					<h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Status de Crédito</h4>
					<div className="grid grid-cols-3 gap-2">
						{creditStatuses.map((s) => (
							<Button
								key={s.value}
								variant="outline"
								size="sm"
								className={cn("justify-start", order.status === s.value && "ring-2 ring-primary")}
								onClick={() => handleCreditStatusChange(s.value)}
							>
								<Check className={cn("mr-2 h-4 w-4", order.status === s.value ? "opacity-100" : "opacity-0")} />
								{s.label}
							</Button>
						))}
					</div>
				</div>

				<div className="h-px bg-border my-2" />

				{/* Seção: Status do Pedido */}
				<div className="space-y-2">
					<h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Status do Pedido</h4>
					<div className="grid grid-cols-2 gap-2">
						{workflowStatuses.map((s) => (
							<Button
								key={s.value}
								variant="outline"
								size="sm"
								className={cn("justify-start text-xs", order.order_status === s.value && "ring-2 ring-primary")}
								onClick={() => handleWorkflowStatusChange(s.value)}
							>
								<Check className={cn("mr-2 h-3 w-3", order.order_status === s.value ? "opacity-100" : "opacity-0")} />
								{s.label}
							</Button>
						))}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}
