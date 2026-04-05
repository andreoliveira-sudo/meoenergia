"use client"

import { useQueryClient } from "@tanstack/react-query"
import { AlertTriangle } from "lucide-react"
import { useState } from "react"

import { updateOrderStatus } from "@/actions/orders"
import { updateOrderWorkflowStatus } from "@/actions/orders/update-order-workflow-status"
import { useOperationFeedback } from "@/components/feedback/operation-feedback"
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { OrderStatus, OrderWorkflowStatus, OrderWithRelations } from "@/lib/definitions/orders"

const creditStatuses: { value: OrderStatus; label: string }[] = [
	{ value: "analysis_pending", label: "Ag. Análise" },
	{ value: "analysis_approved", label: "Aprovado" },
	{ value: "analysis_rejected", label: "Reprovado" },
]

const workflowStatuses: { value: OrderWorkflowStatus; label: string }[] = [
	{ value: "in_review", label: "Em revisão" },
	{ value: "rejected", label: "Reprovado" },
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
	{ value: "finished", label: "Finalizado" },
	{ value: "canceled", label: "Cancelado" },
]

const getCreditLabel = (value: string) => creditStatuses.find((s) => s.value === value)?.label || value
const getWorkflowLabel = (value: string) => workflowStatuses.find((s) => s.value === value)?.label || value

interface UpdateOrderStatusDialogProps {
	order: OrderWithRelations
	open: boolean
	onOpenChange: (open: boolean) => void
}

export const UpdateOrderStatusDialog = ({ order, open, onOpenChange }: UpdateOrderStatusDialogProps) => {
	const queryClient = useQueryClient()
	const { execute } = useOperationFeedback()

	const [selectedCredit, setSelectedCredit] = useState<string>("")
	const [selectedWorkflow, setSelectedWorkflow] = useState<string>("")
	const [confirmOpen, setConfirmOpen] = useState(false)
	const [pendingAction, setPendingAction] = useState<{
		type: "credit" | "workflow"
		value: string
		label: string
		currentLabel: string
	} | null>(null)

	const invalidateAll = () => {
		queryClient.invalidateQueries({ queryKey: ["orders"] })
		queryClient.invalidateQueries({ queryKey: ["orders-paginated"] })
		queryClient.invalidateQueries({ queryKey: ["order-details", order.id] })
		queryClient.invalidateQueries({ queryKey: ["order-history", order.id] })
		queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
	}

	const handleConfirmClick = () => {
		// Verificar qual select mudou
		if (selectedCredit && selectedCredit !== order.status) {
			setPendingAction({
				type: "credit",
				value: selectedCredit,
				label: getCreditLabel(selectedCredit),
				currentLabel: getCreditLabel(order.status),
			})
			setConfirmOpen(true)
		} else if (selectedWorkflow && selectedWorkflow !== (order.order_status || "")) {
			setPendingAction({
				type: "workflow",
				value: selectedWorkflow,
				label: getWorkflowLabel(selectedWorkflow),
				currentLabel: order.order_status ? getWorkflowLabel(order.order_status) : "Nenhum",
			})
			setConfirmOpen(true)
		}
	}

	const handleConfirm = () => {
		if (!pendingAction) return
		setConfirmOpen(false)

		const action = pendingAction.type === "credit"
			? () => updateOrderStatus({ orderId: order.id, status: pendingAction.value as OrderStatus })
			: () => updateOrderWorkflowStatus({ orderId: order.id, orderStatus: pendingAction.value as OrderWorkflowStatus })

		const label = pendingAction.type === "credit" ? "status de crédito" : "status do pedido"

		execute({
			action,
			loadingMessage: `Atualizando ${label}...`,
			successMessage: (res) => res.message,
			onSuccess: () => {
				onOpenChange(false)
				setSelectedCredit("")
				setSelectedWorkflow("")
				invalidateAll()
			},
		})

		setPendingAction(null)
	}

	const hasChange = (selectedCredit && selectedCredit !== order.status) ||
		(selectedWorkflow && selectedWorkflow !== (order.order_status || ""))

	return (
		<>
			<Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setSelectedCredit(""); setSelectedWorkflow(""); } }}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Alterar Status — Pedido #{order.kdi}</DialogTitle>
						<DialogDescription>Selecione o novo status e confirme a alteração.</DialogDescription>
					</DialogHeader>

					<div className="space-y-5 py-2">
						{/* Status de Crédito */}
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label className="text-sm font-semibold">Status de Crédito</Label>
								<Badge variant="outline" className="text-xs">{getCreditLabel(order.status)}</Badge>
							</div>
							<Select value={selectedCredit} onValueChange={(v) => { setSelectedCredit(v); setSelectedWorkflow(""); }}>
								<SelectTrigger>
									<SelectValue placeholder="Selecione o status de crédito" />
								</SelectTrigger>
								<SelectContent>
									{creditStatuses.map((s) => (
										<SelectItem key={s.value} value={s.value}>
											{s.label} {s.value === order.status && "(atual)"}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="h-px bg-border" />

						{/* Status do Pedido */}
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label className="text-sm font-semibold">Status do Pedido</Label>
								<Badge variant="outline" className="text-xs">
									{order.order_status ? getWorkflowLabel(order.order_status) : "Nenhum"}
								</Badge>
							</div>
							<Select value={selectedWorkflow} onValueChange={(v) => { setSelectedWorkflow(v); setSelectedCredit(""); }}>
								<SelectTrigger>
									<SelectValue placeholder="Selecione o status do pedido" />
								</SelectTrigger>
								<SelectContent>
									{workflowStatuses.map((s) => (
										<SelectItem key={s.value} value={s.value}>
											{s.label} {s.value === order.order_status && "(atual)"}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<DialogFooter>
						<Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
						<Button onClick={handleConfirmClick} disabled={!hasChange}>Confirmar</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Modal de Confirmação */}
			<AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle className="flex items-center gap-2">
							<AlertTriangle className="h-5 w-5 text-amber-500" />
							Confirmar Alteração
						</AlertDialogTitle>
						<AlertDialogDescription asChild>
							<div className="space-y-3 pt-2">
								<p>
									Alterar <strong>{pendingAction?.type === "credit" ? "status de crédito" : "status do pedido"}</strong> do pedido <strong>#{order.kdi}</strong>?
								</p>
								<div className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
									<div className="text-center flex-1">
										<span className="text-xs text-muted-foreground block mb-1">Atual</span>
										<span className="font-semibold text-sm">{pendingAction?.currentLabel}</span>
									</div>
									<span className="text-muted-foreground text-lg">→</span>
									<div className="text-center flex-1">
										<span className="text-xs text-muted-foreground block mb-1">Novo</span>
										<span className="font-semibold text-sm text-primary">{pendingAction?.label}</span>
									</div>
								</div>
							</div>
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction onClick={handleConfirm}>Confirmar</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}
