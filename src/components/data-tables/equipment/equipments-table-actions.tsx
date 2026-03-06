"use client"

import { useQueryClient } from "@tanstack/react-query"
import { Edit, Loader2, Trash2 } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { deleteEquipment } from "@/actions/equipments"
import { EditEquipmentDialog } from "@/components/dialogs/edit-equipment-dialog"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { EquipmentWithRelations } from "@/lib/definitions/equipments"

export const EquipmentsTableActions = ({ equipment }: { equipment: EquipmentWithRelations }) => {
	const [isDeletePending, startDeleteTransition] = useTransition()
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
	const queryClient = useQueryClient()

	const handleDelete = () => {
		startDeleteTransition(() => {
			toast.promise(deleteEquipment(equipment.id), {
				loading: `Deletando equipamento "${equipment.name}"...`,
				success: (res) => {
					if (res.success) {
						queryClient.invalidateQueries({ queryKey: ["equipments"] })
						return res.message
					}
					throw new Error(res.message)
				},
				error: (err: Error) => err.message
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
						<Button variant="ghost" size="icon" onClick={handleDelete} disabled={isDeletePending}>
							{isDeletePending ? <Loader2 className="h-4 w-4 animate-spin text-destructive" /> : <Trash2 className="h-4 w-4 text-destructive" />}
							<span className="sr-only">Deletar</span>
						</Button>
					</TooltipTrigger>
					<TooltipContent>Deletar Equipamento</TooltipContent>
				</Tooltip>
			</div>
			<EditEquipmentDialog equipment={equipment} open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} />
		</>
	)
}
