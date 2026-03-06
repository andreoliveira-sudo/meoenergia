import { redirect } from "next/navigation"

import { hasPermission } from "@/actions/auth"
import { CustomerTable } from "@/components/data-tables/customers/customer-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const CustomersPage = async () => {
	const canViewCustomers = await hasPermission("simulations:view") // Usando uma permissão existente por enquanto

	if (!canViewCustomers) {
		redirect("/dashboard/home")
	}

	return (
		<div className="flex flex-col gap-8">
			<div className="space-y-1.5">
				<h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
				<p className="text-muted-foreground">Visualize e gerencie todos os clientes cadastrados.</p>
			</div>
			<Card>
				<CardHeader>
					<CardTitle>Todos os Clientes</CardTitle>
					<CardDescription>Lista de todos os clientes registrados no sistema, originados a partir de simulações.</CardDescription>
				</CardHeader>
				<CardContent>
					<CustomerTable />
				</CardContent>
			</Card>
		</div>
	)
}

export default CustomersPage
