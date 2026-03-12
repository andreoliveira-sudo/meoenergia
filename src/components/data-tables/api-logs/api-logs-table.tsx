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

import getApiLogs from "@/actions/developer/get-api-logs"
import { columns } from "@/components/data-tables/api-logs/columns"
import { ApiLogsTableToolbar } from "@/components/data-tables/api-logs/api-logs-table-toolbar"
import { DataTable } from "@/components/ui/data-table"
import { DataTableSkeleton } from "@/components/ui/data-table-skeleton"
import { DataTableViewOptions } from "@/components/ui/data-table-view-options"
import { usePersistedTableState } from "@/hooks/use-persisted-table-state"

const API_LOGS_TABLE_STORAGE_KEY = "api-logs-table-state"

export const ApiLogsTable = () => {
	const { sorting, setSorting, columnFilters, setColumnFilters, columnVisibility, setColumnVisibility } = usePersistedTableState({
		storageKey: API_LOGS_TABLE_STORAGE_KEY,
		initialState: {
			sorting: [{ id: "created_at", desc: true }]
		}
	})

	const { data: response, isLoading } = useQuery({
		queryKey: ["api-logs"],
		queryFn: getApiLogs,
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
		method: "Método",
		path: "Caminho",
		status_code: "Status",
		duration_ms: "Duração",
		api_key_name: "Chave API"
	}

	const toolbar = (
		<div className="flex items-center justify-between">
			<ApiLogsTableToolbar table={table} />
			<DataTableViewOptions table={table} columnNameMap={columnNameMap} />
		</div>
	)

	if (isLoading) {
		return <DataTableSkeleton columnCount={columns.length} />
	}

	return <DataTable table={table} toolbar={toolbar} />
}
