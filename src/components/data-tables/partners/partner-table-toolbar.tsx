"use client"

import type { Table } from "@tanstack/react-table"
import { X } from "lucide-react"
import { useMemo } from "react"

import { Button } from "@/components/ui/button"
import { DataTableFacetedFilter } from "@/components/ui/data-table-faceted-filter"
import { Input } from "@/components/ui/input"

import type { PartnerWithSellerName } from "@/lib/definitions/partners"

interface PartnerTableToolbarProps<TData> {
	table: Table<TData>
}

const statuses = [
	{ value: "approved", label: "Aprovado" },
	{ value: "pending", label: "Ag. Aprovação" },
	{ value: "rejected", label: "Negado" }
]

const activeStatuses = [
	{ value: "true", label: "Ativo" },
	{ value: "false", label: "Inativo" }
]

export const PartnerTableToolbar = <TData,>({ table }: PartnerTableToolbarProps<TData>) => {
	const isFiltered = table.getState().columnFilters.length > 0

	const uniqueCities = useMemo(() => {
		const cities = new Set<string>()
		table.getCoreRowModel().rows.forEach((row) => {
			const city = (row.original as PartnerWithSellerName).city
			if (city) cities.add(city)
		})
		return Array.from(cities).map((city) => ({ label: city, value: city }))
	}, [table.getCoreRowModel().rows])

	const uniqueStates = useMemo(() => {
		const states = new Set<string>()
		table.getCoreRowModel().rows.forEach((row) => {
			const state = (row.original as PartnerWithSellerName).state
			if (state) states.add(state)
		})
		return Array.from(states).map((state) => ({ label: state, value: state }))
	}, [table.getCoreRowModel().rows])

	const uniqueInternalManagers = useMemo(() => {
		const managers = new Set<string>()
		table.getCoreRowModel().rows.forEach((row) => {
			const sellerName = (row.original as PartnerWithSellerName).seller_name
			if (sellerName) managers.add(sellerName)
		})
		return Array.from(managers).map((name) => ({ label: name, value: name }))
	}, [table.getCoreRowModel().rows])

	return (
		<div className="flex items-center justify-between">
			<div className="flex flex-1 flex-wrap items-center gap-2">
				<Input
					placeholder="Filtrar por Razão Social..."
					value={(table.getColumn("legal_business_name")?.getFilterValue() as string) ?? ""}
					onChange={(event) => table.getColumn("legal_business_name")?.setFilterValue(event.target.value)}
					className="h-8 w-[150px] lg:w-[250px]"
				/>
				{table.getColumn("status") && <DataTableFacetedFilter column={table.getColumn("status")} title="Status" options={statuses} />}
				{table.getColumn("is_active") && <DataTableFacetedFilter column={table.getColumn("is_active")} title="Ativo" options={activeStatuses} />}
				{table.getColumn("seller_name") && (
					<DataTableFacetedFilter column={table.getColumn("seller_name")} title="Gestor Interno" options={uniqueInternalManagers} />
				)}
				{table.getColumn("state") && <DataTableFacetedFilter column={table.getColumn("state")} title="Estado" options={uniqueStates} />}
				{table.getColumn("city") && <DataTableFacetedFilter column={table.getColumn("city")} title="Cidade" options={uniqueCities} />}
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
