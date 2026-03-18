"use client"

import { useQueryClient } from "@tanstack/react-query"
import { Edit, Loader2, Trash2 } from "lucide-react"
import { useState, useTransition } from "react"
import { deleteEquipment } from "@/actions/equipments"
import { EditEquipmentDialog } from "@/components/dialogs/edit-equipment-dialog"
import { useOperationFeedback } from "@/components/feedback/operation-feedback"
import { Button } from "@/components/ui/button"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { EquipmentWithRelations } from "@/lib/definitions/equipments"

export const EquipmentsTableActions = ({ equipment }: { equipment: EquipmentWithRelations }) => {
	const [isDeletePending, startDeleteTransition] = useTransition()
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
	const [deleteOpen, setDeleteOpen] = useState(false)
	const queryClient = useQueryClient()
	const { execute } = useOperationFeedback()

	const handleDelete = () => {
		startDeleteTransition(() => {
			execute({
				action: () => deleteEquipment(equipment.id),
				loadingMessage: `Deletando equipamento "${equipment.name}"...`,
				successMessage: (res) => res.message,
				onSuccess: () => queryClient.invalidateQueries({ queryKey: ["equipments"] })
			})
		})
	}

	return (
		<>
			<div className="flex items-center justify-center space-x-1">
				<Tooltip>
					<TooltipTrigger asChild>
						<Button variant="ghost" size="icon" onClick={() => setIsEditDialogOpen(true)}>
							<Edit className="h-4 w-4" />
							<span className="sr-only">Editar Equipamento</span>
						</Button>
					</TooltipTrigger>
					<TooltipContent>Editar Equipamento</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<Button variant="ghost" size="icon" onClick={() => setDeleteOpen(true)} disabled={isDeletePending}>
							{isDeletePending ? <Loader2 className="h-4 w-4 animate-spin text-destructive" /> : <Trash2 className="h-4 w-4 text-destructive" />}
							<span className="sr-only">Deletar</span>
						</Button>
					</TooltipTrigger>
					<TooltipContent>Deletar Equipamento</TooltipContent>
				</Tooltip>
			</div>
			<EditEquipmentDialog equipment={equipment} open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} />
			<ConfirmDeleteDialog
				open={deleteOpen}
				onOpenChange={setDeleteOpen}
				onConfirm={handleDelete}
				title="Excluir Equipamento"
				description="Tem certeza que deseja excluir este equipamento?"
				loading={isDeletePending}
			/>
		</>
	)
}
