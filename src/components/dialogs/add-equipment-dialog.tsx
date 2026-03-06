"use client"

import { PlusCircle } from "lucide-react"
import * as React from "react"

import { AddEquipmentForm } from "@/components/forms/add-equipment-form"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export const AddEquipmentDialog = () => {
	const [open, setOpen] = React.useState(false)

	const handleSuccess = () => {
		setOpen(false)
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button>
					<PlusCircle />
					Adicionar Equipamento
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Adicionar Novo Equipamento</DialogTitle>
					<DialogDescription>Preencha os dados abaixo para adicionar um novo equipamento ao sistema.</DialogDescription>
				</DialogHeader>
				<AddEquipmentForm onSuccess={handleSuccess} />
			</DialogContent>
		</Dialog>
	)
}
