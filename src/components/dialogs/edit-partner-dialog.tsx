"use client"

import { EditPartnerForm } from "@/components/forms/edit-partner-form"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Partner } from "@/lib/definitions/partners"

interface EditPartnerDialogProps {
	partner: Partner
	open: boolean
	onOpenChange: (open: boolean) => void
}

const EditPartnerDialog = ({ partner, open, onOpenChange }: EditPartnerDialogProps) => {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Editar Parceiro</DialogTitle>
					<DialogDescription>Altere as informações do parceiro abaixo.</DialogDescription>
				</DialogHeader>
				<EditPartnerForm partner={partner} />
			</DialogContent>
		</Dialog>
	)
}

export { EditPartnerDialog }
