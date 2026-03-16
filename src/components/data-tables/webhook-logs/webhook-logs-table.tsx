"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import {
	getCoreRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable
} from "@tanstack/react-table"
import { Loader2, Play } from "lucide-react"
import { toast } from "sonner"

import getWebhookLogs from "@/actions/developer/get-webhook-logs"
import { replayMissedWebhooks } from "@/actions/developer/resend-webhook"
import { columns } from "@/components/data-tables/webhook-logs/columns"
import { WebhookLogsTableToolbar } from "@/components/data-tables/webhook-logs/webhook-logs-table-toolbar"
import { DataTable } from "@/components/ui/data-table"
import { DataTableSkeleton } from "@/components/ui/data-table-skeleton"
import { DataTableViewOptions } from "@/components/ui/data-table-view-options"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { usePersistedTableState } from "@/hooks/use-persisted-table-state"

const WEBHOOK_LOGS_TABLE_STORAGE_KEY = "webhook-logs-table-state"

function ReplayPanel() {
	const [dateFrom, setDateFrom] = useState("2026-03-14")
	const [dateTo, setDateTo] = useState(new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" }))
	const [delaySeconds, setDelaySeconds] = useState(2)
	const [running, setRunning] = useState(false)
	const [result, setResult] = useState<string | null>(null)
	const queryClient = useQueryClient()

	const handleReplay = async () => {
		if (!dateFrom || !dateTo) {
			toast.error("Informe as datas de inicio e fim")
			return
		}

		setRunning(true)
		setResult(null)

		try {
			const res = await replayMissedWebhooks(dateFrom, dateTo, delaySeconds * 1000)
			if (res.success) {
				toast.success(res.message)
				setResult(res.message)
				queryClient.invalidateQueries({ queryKey: ["webhook-logs"] })
			} else {
				toast.error(res.message)
				setResult(res.message)
			}
		} catch {
			toast.error("Erro no replay")
		} finally {
			setRunning(false)
		}
	}

	return (
		<div className="flex items-end gap-3 p-3 border rounded-lg bg-muted/30">
			<div className="flex flex-col gap-1">
				<Label className="text-xs">De</Label>
				<Input
					type="date"
					value={dateFrom}
					onChange={(e) => setDateFrom(e.target.value)}
					className="h-8 w-[150px] text-xs"
					disabled={running}
				/>
			</div>
			<div className="flex flex-col gap-1">
				<Label className="text-xs">Ate</Label>
				<Input
					type="date"
					value={dateTo}
					onChange={(e) => setDateTo(e.target.value)}
					className="h-8 w-[150px] text-xs"
					disabled={running}
				/>
			</div>
			<div className="flex flex-col gap-1">
				<Label className="text-xs">Intervalo (seg)</Label>
				<Input
					type="number"
					min={1}
					max={30}
					value={delaySeconds}
					onChange={(e) => setDelaySeconds(Math.max(1, Math.min(30, Number(e.target.value))))}
					className="h-8 w-[90px] text-xs"
					disabled={running}
				/>
			</div>
			<Button
				size="sm"
				className="h-8 gap-1.5"
				onClick={handleReplay}
				disabled={running}
			>
				{running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
				{running ? "Enviando..." : "Replay Webhooks"}
			</Button>
			{result && (
				<span className="text-xs text-muted-foreground ml-2">{result}</span>
			)}
		</div>
	)
}

export const WebhookLogsTable = () => {
	const { sorting, setSorting, columnFilters, setColumnFilters, columnVisibility, setColumnVisibility } = usePersistedTableState({
		storageKey: WEBHOOK_LOGS_TABLE_STORAGE_KEY,
		initialState: {
			sorting: [{ id: "created_at", desc: true }]
		}
	})

	const { data: response, isLoading } = useQuery({
		queryKey: ["webhook-logs"],
		queryFn: getWebhookLogs,
		refetchInterval: 30_000,
		refetchIntervalInBackground: false
	})

	const data = useMemo(() => {
		if (!response?.success || !response.data) return []
		return response.data
	}, [response])

	const table = useReactTable({
		data,
		columns,
		state: {
			sorting,
			columnVisibility,
			columnFilters
		},
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues()
	})

	const columnNameMap: { [key: string]: string } = {
		created_at: "Data/Hora",
		event_type: "Evento",
		url: "URL Webhook",
		status_code: "Status",
		success: "Resultado",
		payload: "JSON Envio",
		response_body: "JSON Resposta",
		api_key_name: "Chave API",
		actions: "Acao"
	}

	const toolbar = (
		<div className="flex flex-col gap-3">
			<ReplayPanel />
			<div className="flex items-center justify-between">
				<WebhookLogsTableToolbar table={table} />
				<DataTableViewOptions table={table} columnNameMap={columnNameMap} />
			</div>
		</div>
	)

	if (isLoading) {
		return <DataTableSkeleton columnCount={columns.length} />
	}

	return <DataTable table={table} toolbar={toolbar} />
}
