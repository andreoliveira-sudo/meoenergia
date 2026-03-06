import { redirect } from "next/navigation"

import { hasPermission } from "@/actions/auth"
import { OrdersTable } from "@/components/data-tables/orders/orders-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const OrdersPage = async ({ searchParams }: { searchParams: Promise<{ id?: string; type?: string }> }) => {
	const canViewOrders = await hasPermission("orders:view")

	if (!canViewOrders) {
		return redirect("/dashboard/home")
	}

	const { id, type } = (await searchParams) || {}
	const filterType = type === "pf" || type === "pj" ? type : undefined
	const title = filterType === "pf" ? "Pedidos — Pessoa Física" : filterType === "pj" ? "Pedidos — Pessoa Jurídica" : "Pedidos"
	const description = filterType
		? `Visualize e gerencie os pedidos de ${filterType === "pf" ? "Pessoa Física" : "Pessoa Jurídica"}.`
		: "Visualize e gerencie todos os pedidos criados no sistema."

	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">{title}</h1>
					<p className="text-muted-foreground">{description}</p>
				</div>
			</div>
			<Card>
				<CardHeader>
					<CardTitle>Histórico de Pedidos</CardTitle>
					<CardDescription>Lista de todos os pedidos gerados a partir de simulações.</CardDescription>
				</CardHeader>
				<CardContent>
					<OrdersTable filterId={id} filterType={filterType} />
				</CardContent>
			</Card>
		</div>
	)
}

export default OrdersPage
