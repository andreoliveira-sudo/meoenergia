"use client"

import { EditCustomerForm } from "@/components/forms/edit-customer-form"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { CustomerType } from "@/lib/definitions/customers"

interface EditCustomerDialogProps {
	customerId: string
	customerType?: CustomerType
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function EditCustomerDialog({ customerId, customerType, open, onOpenChange }: EditCustomerDialogProps) {
	const isPf = customerType === "pf"
	const title = isPf ? "Editar Pessoa Física" : "Editar Pessoa Jurídica"
	const description = isPf
		? "Altere as informações da pessoa física abaixo. O CPF não pode ser alterado."
		: "Altere as informações da pessoa jurídica abaixo. O CNPJ não pode ser alterado."

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				{open && <EditCustomerForm customerId={customerId} onFinished={() => onOpenChange(false)} />}
			</DialogContent>
		</Dialog>
	)
}
