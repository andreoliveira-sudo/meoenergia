"use client"

import { PlusCircle } from "lucide-react"
import { useState } from "react"

import { AddBrandForm } from "@/components/forms/add-brand-form"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export const AddBrandDialog = () => {
	const [open, setOpen] = useState(false)

	const handleSuccess = () => {
		setOpen(false)
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button>
					<PlusCircle />
					Adicionar Marca
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Adicionar Nova Marca de Equipamento</DialogTitle>
					<DialogDescription>Digite o nome da nova marca para adicioná-la ao sistema.</DialogDescription>
				</DialogHeader>
				<AddBrandForm onSuccess={handleSuccess} />
			</DialogContent>
		</Dialog>
	)
}
