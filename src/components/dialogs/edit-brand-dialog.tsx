"use client"

import { AlertTriangle } from "lucide-react"
import { useState } from "react"

import { EditBrandForm } from "@/components/forms/edit-brand-form"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { EquipmentBrand } from "@/lib/definitions/equipments"

interface EditBrandDialogProps {
	brand: EquipmentBrand
	open: boolean
	onOpenChange: (open: boolean) => void
}

export const EditBrandDialog = ({ brand, open, onOpenChange }: EditBrandDialogProps) => {
	const handleSuccess = () => {
		onOpenChange(false)
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Editar Marca</DialogTitle>
					<DialogDescription>
						Altere o nome da marca <span className="font-bold text-primary">{brand.name}</span>.
						<p className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5">
							<AlertTriangle className="h-3.5 w-3.5" />
							Essa alteração afetará todos os equipamentos que já utilizam esta marca.
						</p>
					</DialogDescription>
				</DialogHeader>
				<EditBrandForm brand={brand} onSuccess={handleSuccess} />
			</DialogContent>
		</Dialog>
	)
}
