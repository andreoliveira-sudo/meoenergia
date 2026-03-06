"use client"

"use client"

import type { Table } from "@tanstack/react-table"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DataTableFacetedFilter } from "@/components/ui/data-table-faceted-filter"
import { Input } from "@/components/ui/input"

interface CustomerTableToolbarProps<TData> {
	table: Table<TData>
}

export const CustomerTableToolbar = <TData,>({ table }: CustomerTableToolbarProps<TData>) => {
	const isFiltered = table.getState().columnFilters.length > 0

	// opções únicas para Parceiro
	const uniquePartners = Array.from(
		new Set(
			table
				.getCoreRowModel()
				.rows.map((row) => row.getValue("partner_name") as string | null)
				.filter(Boolean)
		)
	).map((value) => ({ label: value as string, value: value as string }))

	// opções únicas para Gestor Interno
	const uniqueManagers = Array.from(
		new Set(
			table
				.getCoreRowModel()
				.rows.map((row) => row.getValue("internal_manager_name") as string | null)
				.filter(Boolean)
		)
	).map((value) => ({ label: value as string, value: value as string }))

	// opções únicas para Cidade
	const uniqueCities = Array.from(
		new Set(
			table
				.getCoreRowModel()
				.rows.map((row) => row.getValue("city") as string | null)
				.filter(Boolean)
		)
	).map((value) => ({ label: value as string, value: value as string }))

	// opções únicas para Estado
	const uniqueStates = Array.from(
		new Set(
			table
				.getCoreRowModel()
				.rows.map((row) => row.getValue("state") as string | null)
				.filter(Boolean)
		)
	).map((value) => ({ label: value as string, value: value as string }))

	return (
		<div className="flex items-center justify-between">
			<div className="flex flex-1 flex-wrap items-center gap-2">
				<Input
					placeholder="Filtrar por Razão Social..."
					value={(table.getColumn("company_name")?.getFilterValue() as string) ?? ""}
					onChange={(event) => table.getColumn("company_name")?.setFilterValue(event.target.value)}
					className="h-8 w-[150px] lg:w-[250px]"
				/>

				{/* Parceiro */}
				{table.getColumn("partner_name") && <DataTableFacetedFilter column={table.getColumn("partner_name")} title="Parceiro" options={uniquePartners} />}

				{/* Gestor Interno */}
				{table.getColumn("internal_manager_name") && (
					<DataTableFacetedFilter column={table.getColumn("internal_manager_name")} title="Gestor Interno" options={uniqueManagers} />
				)}

				{/* Cidade */}
				{table.getColumn("city") && <DataTableFacetedFilter column={table.getColumn("city")} title="Cidade" options={uniqueCities} />}

				{/* Estado */}
				{table.getColumn("state") && <DataTableFacetedFilter column={table.getColumn("state")} title="Estado" options={uniqueStates} />}

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
