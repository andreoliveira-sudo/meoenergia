"use client"

import { EditCustomerForm } from "@/components/forms/edit-customer-form"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface EditCustomerDialogProps {
	customerId: string
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function EditCustomerDialog({ customerId, open, onOpenChange }: EditCustomerDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Editar Cliente</DialogTitle>
					<DialogDescription>Altere as informações do cliente abaixo. O CNPJ não pode ser alterado.</DialogDescription>
				</DialogHeader>
				{open && <EditCustomerForm customerId={customerId} onFinished={() => onOpenChange(false)} />}
			</DialogContent>
		</Dialog>
	)
}
