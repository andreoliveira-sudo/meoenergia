"use client"

import { PlusCircle } from "lucide-react"
import * as React from "react"

import { AddStructureTypeForm } from "@/components/forms/add-structure-type-form"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export const AddStructureTypeDialog = () => {
	const [open, setOpen] = React.useState(false)

	const handleSuccess = () => {
		setOpen(false)
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button>
					<PlusCircle />
					Adicionar Tipo
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Adicionar Novo Tipo de Estrutura</DialogTitle>
					<DialogDescription>Digite o nome do novo tipo de estrutura para adicioná-lo ao sistema.</DialogDescription>
				</DialogHeader>
				<AddStructureTypeForm onSuccess={handleSuccess} />
			</DialogContent>
		</Dialog>
	)
}
