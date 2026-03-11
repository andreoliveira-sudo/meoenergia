import { redirect } from "next/navigation"

import { hasPermission } from "@/actions/auth"
import { OrdersTable } from "@/components/data-tables/orders/orders-table"
import { OrderDialogs } from "@/components/dialogs/order-dialogs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const OrdersPage = async ({ searchParams }: { searchParams: Promise<{ id?: string; type?: string; dateFrom?: string; dateTo?: string; status?: string }> }) => {
	const canViewOrders = await hasPermission("orders:view")

	if (!canViewOrders) {
		return redirect("/dashboard/home")
	}

	const { id, type, dateFrom, dateTo, status } = (await searchParams) || {}

	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
					<p className="text-muted-foreground">Visualize e gerencie todos os pedidos criados no sistema.</p>
				</div>
				<OrderDialogs type={type} />
			</div>
			<Card>
				<CardHeader>
					<CardTitle>{"Hist\u00f3rico de Pedidos"}</CardTitle>
					<CardDescription>{"Lista de todos os pedidos gerados a partir de simula\u00e7\u00f5es."}</CardDescription>
				</CardHeader>
				<CardContent>
					<OrdersTable filterId={id} filterType={type as "pf" | "pj" | undefined} dateFrom={dateFrom} dateTo={dateTo} filterStatus={status} />
				</CardContent>
			</Card>
		</div>
	)
}

export default OrdersPage
