"use client"

import type { Table } from "@tanstack/react-table"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DataTableFacetedFilter } from "@/components/ui/data-table-faceted-filter"
import { Input } from "@/components/ui/input"

interface WebhookLogsTableToolbarProps<TData> {
	table: Table<TData>
}

export const WebhookLogsTableToolbar = <TData,>({ table }: WebhookLogsTableToolbarProps<TData>) => {
	const isFiltered = table.getState().columnFilters.length > 0

	const eventOptions = [
		{ label: "Ag. Analise", value: "order.status.analysis_pending" },
		{ label: "Aprovado", value: "order.status.analysis_approved" },
		{ label: "Reprovado", value: "order.status.analysis_rejected" },
		{ label: "Ag. Documentos", value: "order.status.documents_pending" },
		{ label: "Analise Docs", value: "order.status.docs_analysis" },
		{ label: "Finalizado", value: "order.status.finished" },
		{ label: "Cancelado", value: "order.status.canceled" },
		{ label: "Pedido Atualizado", value: "order.updated" },
	]

	const statusOptions = [
		{ label: "Sucesso (2xx)", value: "success" },
		{ label: "Erro", value: "error" },
	]

	const resultOptions = [
		{ label: "Enviado", value: "success" },
		{ label: "Falhou", value: "failed" },
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
					placeholder="Filtrar por URL..."
					value={(table.getColumn("url")?.getFilterValue() as string) ?? ""}
					onChange={(event) => table.getColumn("url")?.setFilterValue(event.target.value)}
					className="h-8 w-[150px] lg:w-[250px]"
				/>

				{table.getColumn("event_type") && (
					<DataTableFacetedFilter column={table.getColumn("event_type")} title="Evento" options={eventOptions} />
				)}

				{table.getColumn("status_code") && (
					<DataTableFacetedFilter column={table.getColumn("status_code")} title="Status" options={statusOptions} />
				)}

				{table.getColumn("success") && (
					<DataTableFacetedFilter column={table.getColumn("success")} title="Resultado" options={resultOptions} />
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
