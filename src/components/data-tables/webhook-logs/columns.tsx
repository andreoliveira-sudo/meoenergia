"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, CheckCircle2, ChevronDown, ChevronRight, Copy, XCircle } from "lucide-react"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { WebhookLog } from "@/actions/developer/get-webhook-logs"
import { format } from "date-fns"

function formatTimestamp(dateString: string): string {
	if (!dateString) return ""
	const date = new Date(dateString)
	return format(date, "dd/MM/yyyy HH:mm:ss")
}

function getEventLabel(eventType: string): string {
	const map: Record<string, string> = {
		"order.status.analysis_pending": "Ag. Analise",
		"order.status.analysis_approved": "Aprovado",
		"order.status.analysis_rejected": "Reprovado",
		"order.status.documents_pending": "Ag. Documentos",
		"order.status.docs_analysis": "Analise Docs",
		"order.status.sending_distributor_invoice": "Envio NF Dist.",
		"order.status.payment_distributor": "Pgto. Dist.",
		"order.status.access_opinion": "Parecer Acesso",
		"order.status.initial_payment_integrator": "Pgto Inicial Int.",
		"order.status.final_payment_integrator": "Pgto Final Int.",
		"order.status.finished": "Finalizado",
		"order.status.canceled": "Cancelado",
		"order.updated": "Pedido Atualizado",
	}
	return map[eventType] || eventType
}

function getEventVariant(eventType: string): "default" | "outline" | "secondary" | "destructive" {
	if (eventType === "order.updated") return "secondary"
	if (eventType.includes("approved") || eventType.includes("finished")) return "default"
	if (eventType.includes("rejected") || eventType.includes("canceled")) return "destructive"
	return "outline"
}

function JsonViewer({ data, label }: { data: unknown; label: string }) {
	const [expanded, setExpanded] = useState(false)
	const [copied, setCopied] = useState(false)

	if (!data) return <span className="text-muted-foreground text-xs">-</span>

	const jsonString = typeof data === "string" ? data : JSON.stringify(data, null, 2)

	const handleCopy = (e: React.MouseEvent) => {
		e.stopPropagation()
		navigator.clipboard.writeText(jsonString)
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}

	if (!expanded) {
		return (
			<Button
				variant="ghost"
				size="sm"
				className="h-7 px-2 text-xs gap-1"
				onClick={() => setExpanded(true)}
			>
				<ChevronRight className="h-3 w-3" />
				{label}
			</Button>
		)
	}

	return (
		<div className="relative">
			<div className="flex items-center gap-1 mb-1">
				<Button
					variant="ghost"
					size="sm"
					className="h-6 px-1 text-xs gap-1"
					onClick={() => setExpanded(false)}
				>
					<ChevronDown className="h-3 w-3" />
					{label}
				</Button>
				<Button
					variant="ghost"
					size="sm"
					className="h-6 w-6 p-0"
					onClick={handleCopy}
					title="Copiar JSON"
				>
					<Copy className="h-3 w-3" />
				</Button>
				{copied && <span className="text-xs text-green-600">Copiado!</span>}
			</div>
			<pre className="text-[10px] leading-tight bg-muted/50 border rounded p-2 max-w-[400px] max-h-[300px] overflow-auto whitespace-pre-wrap break-all">
				{jsonString}
			</pre>
		</div>
	)
}

export const columns: ColumnDef<WebhookLog>[] = [
	{
		accessorKey: "created_at",
		header: ({ column }) => (
			<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
				Data/Hora
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => {
			const date = row.getValue("created_at") as string
			return <span className="whitespace-nowrap font-mono text-xs">{formatTimestamp(date)}</span>
		}
	},
	{
		accessorKey: "event_type",
		header: "Evento",
		cell: ({ row }) => {
			const eventType = row.getValue("event_type") as string
			return (
				<Badge variant={getEventVariant(eventType)} title={eventType}>
					{getEventLabel(eventType)}
				</Badge>
			)
		},
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id))
		}
	},
	{
		accessorKey: "url",
		header: "URL Webhook",
		cell: ({ row }) => {
			const url = row.getValue("url") as string
			return (
				<span className="font-mono text-xs max-w-[250px] truncate block" title={url}>
					{url}
				</span>
			)
		}
	},
	{
		accessorKey: "status_code",
		header: ({ column }) => (
			<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
				Status
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => {
			const status = row.getValue("status_code") as number
			const isSuccess = status >= 200 && status < 300
			const isError = status === 0
			const isClientError = status >= 400 && status < 500
			const isServerError = status >= 500

			return (
				<Badge
					variant={isServerError || isError ? "destructive" : "outline"}
					className={
						isSuccess
							? "border-green-500 text-green-600"
							: isClientError
								? "border-yellow-500 text-yellow-600"
								: ""
					}
				>
					{status === 0 ? "Erro" : status}
				</Badge>
			)
		},
		filterFn: (row, id, value) => {
			const status = row.getValue(id) as number
			if (value.includes("success") && status >= 200 && status < 300) return true
			if (value.includes("error") && (status === 0 || status >= 400)) return true
			return false
		}
	},
	{
		accessorKey: "success",
		header: "Resultado",
		cell: ({ row }) => {
			const success = row.getValue("success") as boolean
			return success ? (
				<div className="flex items-center gap-1.5 text-green-600">
					<CheckCircle2 className="h-4 w-4" />
					<span className="text-xs font-medium">Enviado</span>
				</div>
			) : (
				<div className="flex items-center gap-1.5 text-red-500">
					<XCircle className="h-4 w-4" />
					<span className="text-xs font-medium">Falhou</span>
				</div>
			)
		},
		filterFn: (row, id, value) => {
			const success = row.getValue(id) as boolean
			if (value.includes("success") && success) return true
			if (value.includes("failed") && !success) return true
			return false
		}
	},
	{
		accessorKey: "payload",
		header: "JSON Envio",
		cell: ({ row }) => {
			const payload = row.original.payload
			return <JsonViewer data={payload} label="Ver Envio" />
		},
		enableSorting: false,
	},
	{
		accessorKey: "response_body",
		header: "JSON Resposta",
		cell: ({ row }) => {
			const responseBody = row.original.response_body
			const errorMessage = row.original.error_message
			// Se tem response_body usa ele, senão mostra error_message como fallback
			const data = responseBody || errorMessage
			return <JsonViewer data={data} label="Ver Resposta" />
		},
		enableSorting: false,
	},
	{
		accessorKey: "api_key_name",
		header: "Chave API",
		cell: ({ row }) => {
			const name = row.original.api_key_name
			const prefix = row.original.api_key_prefix
			if (!name) return <span className="text-muted-foreground text-xs">-</span>
			return (
				<div className="flex flex-col">
					<span className="text-sm">{name}</span>
					{prefix && (
						<code className="text-xs text-muted-foreground">{prefix}...</code>
					)}
				</div>
			)
		},
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id))
		}
	}
]
