"use client"

import { useQueryClient } from "@tanstack/react-query"
import { Check, Loader2 } from "lucide-react"
import { useTransition } from "react"
import { toast } from "sonner"

import { updateOrderStatus } from "@/actions/orders"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { OrderStatus, OrderWithRelations } from "@/lib/definitions/orders"
import { cn } from "@/lib/utils"

const availableStatuses: { value: OrderStatus; label: string }[] = [
	{ value: "analysis_pending", label: "Ag. Análise" },
	{ value: "pre_analysis", label: "Análise Prévia" },
	{ value: "confirmation_pending", label: "Em Confirmação" },
	{ value: "credit_analysis", label: "Análise de Crédito" },
	{ value: "documents_pending", label: "Ag. Documentos" },
	{ value: "docs_analysis", label: "Análise Docs" },
	{ value: "final_analysis", label: "Análise Final" },
	{ value: "approved", label: "Aprovado" },
	{ value: "rejected", label: "Reprovado" },
	{ value: "contract_signing", label: "Assinatura Contrato" },
	{ value: "completed", label: "Finalizado" },
	{ value: "canceled", label: "Cancelado" },
	{ value: "pre_approved", label: "Pré-Aprovado" },
	{ value: "pre_approved_orange", label: "Pré-Aprovado(Laranja)" },
	{ value: "frozen", label: "Congelado" }
]

interface UpdateOrderStatusDialogProps {
	order: OrderWithRelations
	open: boolean
	onOpenChange: (open: boolean) => void
}

export const UpdateOrderStatusDialog = ({ order, open, onOpenChange }: UpdateOrderStatusDialogProps) => {
	const [isPending, startTransition] = useTransition()
	const queryClient = useQueryClient()

	const handleStatusChange = (newStatus: OrderStatus) => {
		if (newStatus === order.status) {
			onOpenChange(false)
			return
		}

		startTransition(() => {
			toast.promise(updateOrderStatus({ orderId: order.id, status: newStatus }), {
				loading: "Atualizando status...",
				success: (res) => {
					if (res.success) {
						queryClient.invalidateQueries({ queryKey: ["orders"] })
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
							disabled={isPending}
						>
							{isPending ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<Check className={cn("mr-2 h-4 w-4", order.status === status.value ? "opacity-100" : "opacity-0")} />
							)}
							{status.label}
						</Button>
					))}
				</div>
			</DialogContent>
		</Dialog>
	)
}
