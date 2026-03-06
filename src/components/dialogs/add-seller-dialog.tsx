"use client"

import { PlusCircle } from "lucide-react"

import { RegisterSellerForm } from "@/components/forms/register-seller-form"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

const AddSellerDialog = () => {
	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button className="w-full md:w-auto">
					<PlusCircle />
					Adicionar Vendedor
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Adicionar Novo Vendedor</DialogTitle>
					<DialogDescription>Preencha as informações abaixo para cadastrar um novo vendedor.</DialogDescription>
				</DialogHeader>
				<RegisterSellerForm />
			</DialogContent>
		</Dialog>
	)
}

export { AddSellerDialog }
