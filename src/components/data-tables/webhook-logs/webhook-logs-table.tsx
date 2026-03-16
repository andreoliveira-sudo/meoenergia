"use client"

import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import {
	getCoreRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable
} from "@tanstack/react-table"

import getWebhookLogs from "@/actions/developer/get-webhook-logs"
import { columns } from "@/components/data-tables/webhook-logs/columns"
import { WebhookLogsTableToolbar } from "@/components/data-tables/webhook-logs/webhook-logs-table-toolbar"
import { DataTable } from "@/components/ui/data-table"
import { DataTableSkeleton } from "@/components/ui/data-table-skeleton"
import { DataTableViewOptions } from "@/components/ui/data-table-view-options"
import { usePersistedTableState } from "@/hooks/use-persisted-table-state"

const WEBHOOK_LOGS_TABLE_STORAGE_KEY = "webhook-logs-table-state"

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
		api_key_name: "Chave API"
	}

	const toolbar = (
		<div className="flex items-center justify-between">
			<WebhookLogsTableToolbar table={table} />
			<DataTableViewOptions table={table} columnNameMap={columnNameMap} />
		</div>
	)

	if (isLoading) {
		return <DataTableSkeleton columnCount={columns.length} />
	}

	return <DataTable table={table} toolbar={toolbar} />
}
