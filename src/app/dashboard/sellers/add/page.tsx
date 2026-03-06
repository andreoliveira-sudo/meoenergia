import Link from "next/link"

import { RegisterSellerForm } from "@/components/forms/register-seller-form"
import { Button } from "@/components/ui/button"

const AddSellerPage = () => {
	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Adicionar Novo Vendedor</h1>
					<p className="text-muted-foreground">Preencha os dados abaixo para cadastrar um novo vendedor no sistema.</p>
				</div>
				<Button variant="outline" asChild>
					<Link href="/dashboard/sellers">Visão Geral</Link>
				</Button>
			</div>
			<RegisterSellerForm />
		</div>
	)
}

export default AddSellerPage
