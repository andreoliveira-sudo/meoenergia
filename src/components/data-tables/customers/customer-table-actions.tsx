"use client"

import { Loader2, Pencil, Trash2 } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { EditCustomerDialog } from "@/components/dialogs/edit-customer-dialog"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { CustomerWithRelations } from "@/lib/definitions/customers"
import { useQueryClient } from "@tanstack/react-query"
import { deleteCustomer } from "@/actions/customers"

export const CustomerTableActions = ({ customer }: { customer: CustomerWithRelations }) => {
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
	const [isDeletePending, startDeleteTransition] = useTransition()

	const queryClient = useQueryClient()

	function handleDelete() {
		startDeleteTransition(async () => {
			try {
				const result = await deleteCustomer(customer.id)

				if (result.success) {
					queryClient.invalidateQueries({ queryKey: ["customers"] })
					toast.success(result.message)
				} else {
					toast.error(result.message)
				}
			} catch (err) {
				toast.error(err instanceof Error ? err.message : "Erro desconhecido")
			}
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
						<Button className="delete-button" variant="ghost" size="icon" onClick={handleDelete} disabled={isDeletePending}>
							{isDeletePending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
							<span className="sr-only">Deletar</span>
						</Button>
					</TooltipTrigger>
					<TooltipContent className="tooltip-content bg-destructive fill-destructive text-white">Deletar Cliente</TooltipContent>
				</Tooltip>
			</div>

			<EditCustomerDialog customerId={customer.id} open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} />
		</>
	)
}
