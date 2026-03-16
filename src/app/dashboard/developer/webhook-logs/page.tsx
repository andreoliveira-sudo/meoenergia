import { redirect } from "next/navigation"

import { hasPermission } from "@/actions/auth"
import { WebhookLogsTable } from "@/components/data-tables/webhook-logs/webhook-logs-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const WebhookLogsPage = async () => {
	const canView = await hasPermission("admin:settings:manage")

	if (!canView) {
		redirect("/dashboard/home")
	}

	return (
		<div className="flex flex-col gap-8">
			<div className="space-y-1.5">
				<h1 className="text-3xl font-bold tracking-tight">Registros de Webhook</h1>
				<p className="text-muted-foreground">Monitore todas as notificacoes enviadas aos parceiros via webhook, incluindo evento, status e resultado.</p>
			</div>
			<Card>
				<CardHeader>
					<CardTitle>Log de Webhooks</CardTitle>
					<CardDescription>Historico das ultimas 500 notificacoes enviadas. Atualizacao automatica a cada 30 segundos.</CardDescription>
				</CardHeader>
				<CardContent>
					<WebhookLogsTable />
				</CardContent>
			</Card>
		</div>
	)
}

export default WebhookLogsPage
