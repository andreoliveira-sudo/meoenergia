"use client"

import { Loader2, Pencil, Trash2 } from "lucide-react"
import { useState, useTransition } from "react"

import { EditCustomerDialog } from "@/components/dialogs/edit-customer-dialog"
import { useOperationFeedback } from "@/components/feedback/operation-feedback"
import { Button } from "@/components/ui/button"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { CustomerWithRelations } from "@/lib/definitions/customers"
import { useQueryClient } from "@tanstack/react-query"
import { deleteCustomer } from "@/actions/customers"

export const CustomerTableActions = ({ customer }: { customer: CustomerWithRelations }) => {
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
	const [deleteOpen, setDeleteOpen] = useState(false)
	const [isDeletePending, startDeleteTransition] = useTransition()
	const queryClient = useQueryClient()
	const { execute } = useOperationFeedback()

	function handleDelete() {
		startDeleteTransition(() => {
			execute({
				action: () => deleteCustomer(customer.id),
				loadingMessage: "Deletando cliente...",
				successMessage: (res) => res.message,
				onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ["customers"] })
				queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
			}
			})
		})
	}

	return (
		<>
			<div className="flex items-center justify-center space-x-1 alternative-buttons">
				<Tooltip>
					<TooltipTrigger asChild>
						<Button variant="ghost" size="icon" onClick={() => setIsEditDialogOpen(true)}>
							<Pencil className="h-4 w-4" />
							<span className="sr-only">Editar Cliente</span>
						</Button>
					</TooltipTrigger>
					<TooltipContent>Editar Cliente</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<Button className="delete-button" variant="ghost" size="icon" onClick={() => setDeleteOpen(true)} disabled={isDeletePending}>
							{isDeletePending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
							<span className="sr-only">Deletar</span>
						</Button>
					</TooltipTrigger>
					<TooltipContent className="tooltip-content bg-destructive fill-destructive text-white">Deletar Cliente</TooltipContent>
				</Tooltip>
			</div>

			<EditCustomerDialog customerId={customer.id} customerType={customer.type} open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} />
			<ConfirmDeleteDialog
				open={deleteOpen}
				onOpenChange={setDeleteOpen}
				onConfirm={handleDelete}
				title="Excluir Cliente"
				description="Tem certeza que deseja excluir este cliente?"
				details={[
					{ label: "Nome", value: customer.company_name },
					{ label: "CNPJ", value: customer.cnpj },
					{ label: "Tipo", value: customer.type === "pj" ? "Pessoa Jurídica" : "Pessoa Física" },
				]}
				loading={isDeletePending}
			/>
		</>
	)
}
