"use client"

import type { Table } from "@tanstack/react-table"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DataTableFacetedFilter } from "@/components/ui/data-table-faceted-filter"
import { Input } from "@/components/ui/input"

interface ApiLogsTableToolbarProps<TData> {
	table: Table<TData>
}

export const ApiLogsTableToolbar = <TData,>({ table }: ApiLogsTableToolbarProps<TData>) => {
	const isFiltered = table.getState().columnFilters.length > 0

	const methodOptions = [
		{ label: "GET", value: "GET" },
		{ label: "POST", value: "POST" },
		{ label: "PUT", value: "PUT" },
		{ label: "PATCH", value: "PATCH" },
		{ label: "DELETE", value: "DELETE" },
	]

	const statusOptions = [
		{ label: "Sucesso (2xx)", value: "success" },
		{ label: "Erro Cliente (4xx)", value: "client_error" },
		{ label: "Erro Servidor (5xx)", value: "server_error" },
	]

	const uniqueKeys = Array.from(
		new Set(
			table
				.getCoreRowModel()
				.rows.map((row) => row.getValue("api_key_name") as string | null)
				.filter(Boolean)
		)
	).map((value) => ({ label: value as string, value: value as string }))

	return (
		<div className="flex items-center justify-between">
			<div className="flex flex-1 flex-wrap items-center gap-2">
				<Input
					placeholder="Filtrar por caminho..."
					value={(table.getColumn("path")?.getFilterValue() as string) ?? ""}
					onChange={(event) => table.getColumn("path")?.setFilterValue(event.target.value)}
					className="h-8 w-[150px] lg:w-[250px]"
				/>

				{table.getColumn("method") && (
					<DataTableFacetedFilter column={table.getColumn("method")} title="Método" options={methodOptions} />
				)}

				{table.getColumn("status_code") && (
					<DataTableFacetedFilter column={table.getColumn("status_code")} title="Status" options={statusOptions} />
				)}

				{table.getColumn("api_key_name") && uniqueKeys.length > 0 && (
					<DataTableFacetedFilter column={table.getColumn("api_key_name")} title="Chave API" options={uniqueKeys} />
				)}

				{isFiltered && (
					<Button variant="ghost" onClick={() => table.resetColumnFilters()} className="h-8 px-2 lg:px-3">
						Limpar
						<X className="ml-2 h-4 w-4" />
					</Button>
				)}
			</div>
		</div>
	)
}
