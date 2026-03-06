"use client"

import { AlertTriangle } from "lucide-react"

import { EditStructureTypeForm } from "@/components/forms/edit-structure-type-form"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { StructureType } from "@/lib/definitions/equipments"

interface EditStructureTypeDialogProps {
	structureType: StructureType
	open: boolean
	onOpenChange: (open: boolean) => void
}

export const EditStructureTypeDialog = ({ structureType, open, onOpenChange }: EditStructureTypeDialogProps) => {
	const handleSuccess = () => {
		onOpenChange(false)
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Editar Tipo de Estrutura</DialogTitle>
					<DialogDescription>
						Altere o nome do tipo de estrutura <span className="font-bold text-primary">{structureType.name}</span>.
						<p className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5">
							<AlertTriangle className="h-3.5 w-3.5" />
							Essa alteração afetará todas as simulações que já utilizam este tipo.
						</p>
					</DialogDescription>
				</DialogHeader>
				<EditStructureTypeForm structureType={structureType} onSuccess={handleSuccess} />
			</DialogContent>
		</Dialog>
	)
}
