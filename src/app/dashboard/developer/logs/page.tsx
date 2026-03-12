import { redirect } from "next/navigation"

import { hasPermission } from "@/actions/auth"
import { ApiLogsTable } from "@/components/data-tables/api-logs/api-logs-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const ApiLogsPage = async () => {
	const canView = await hasPermission("admin:settings:manage")

	if (!canView) {
		redirect("/dashboard/home")
	}

	return (
		<div className="flex flex-col gap-8">
			<div className="space-y-1.5">
				<h1 className="text-3xl font-bold tracking-tight">Registros de API</h1>
				<p className="text-muted-foreground">Monitore todas as requisições feitas à API, incluindo status, duração e chave utilizada.</p>
			</div>
			<Card>
				<CardHeader>
					<CardTitle>Logs de Requisições</CardTitle>
					<CardDescription>Histórico das últimas 500 requisições processadas pela API. Atualização automática a cada 30 segundos.</CardDescription>
				</CardHeader>
				<CardContent>
					<ApiLogsTable />
				</CardContent>
			</Card>
		</div>
	)
}

export default ApiLogsPage
