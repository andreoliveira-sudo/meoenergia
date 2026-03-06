"use client"

import type { PropsWithChildren } from "react"

import { EditSellerForm } from "@/components/forms/edit-seller-form"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { Seller } from "@/lib/definitions/sellers"

interface EditSellerDialogProps extends PropsWithChildren {
	seller: Seller
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function EditSellerDialog({ seller, open, onOpenChange, children }: EditSellerDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			{children && <DialogTrigger asChild>{children}</DialogTrigger>}
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Editar Vendedor</DialogTitle>
					<DialogDescription>Altere as informações do vendedor. O email e senha não podem ser alterados aqui.</DialogDescription>
				</DialogHeader>
				<EditSellerForm seller={seller} onFinished={() => onOpenChange(false)} />
			</DialogContent>
		</Dialog>
	)
}
