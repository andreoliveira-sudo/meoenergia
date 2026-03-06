import Link from "next/link"
import { redirect } from "next/navigation"

import { hasPermission } from "@/actions/auth"
import { RegisterPartnerForm } from "@/components/forms/register-partner-form"
import { Button } from "@/components/ui/button"

const AddPartnerPage = async () => {
	const canManagePartners = await hasPermission("partners:manage")

	if (!canManagePartners) {
		redirect("/dashboard/home")
	}

	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Adicionar Novo Parceiro</h1>
					<p className="text-muted-foreground">Preencha os dados abaixo para cadastrar um novo parceiro no sistema.</p>
				</div>
				<Button variant="outline" asChild>
					<Link href="/dashboard/partners">Voltar para Parceiros</Link>
				</Button>
			</div>
			<RegisterPartnerForm />
		</div>
	)
}

export default AddPartnerPage
