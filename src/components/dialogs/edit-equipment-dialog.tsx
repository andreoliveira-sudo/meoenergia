"use client"

import { EditEquipmentForm } from "@/components/forms/edit-equipment-form"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { EquipmentWithRelations } from "@/lib/definitions/equipments"

interface EditEquipmentDialogProps {
	equipment: EquipmentWithRelations
	open: boolean
	onOpenChange: (open: boolean) => void
}

export const EditEquipmentDialog = ({ equipment, open, onOpenChange }: EditEquipmentDialogProps) => {
	const handleSuccess = () => {
		onOpenChange(false)
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Editar Equipamento</DialogTitle>
					<DialogDescription>
						Altere as informações do equipamento <span className="font-bold text-primary">{equipment.name}</span>.
					</DialogDescription>
				</DialogHeader>
				<EditEquipmentForm equipment={equipment} onSuccess={handleSuccess} />
			</DialogContent>
		</Dialog>
	)
}
