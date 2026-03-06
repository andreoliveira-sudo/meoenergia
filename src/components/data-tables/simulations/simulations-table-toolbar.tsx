"use client"

import type { Table } from "@tanstack/react-table"
import { X } from "lucide-react"
import { useMemo } from "react"

import { Button } from "@/components/ui/button"
import { DataTableFacetedFilter } from "@/components/ui/data-table-faceted-filter"
import { Input } from "@/components/ui/input"
import type { SimulationWithRelations } from "@/lib/definitions/simulations"

interface SimulationsTableToolbarProps<TData> {
	table: Table<TData>
}

const statusOptions = [
	{ label: "Contato Inicial", value: "initial_contact" },
	{ label: "Em análise Cliente", value: "under_review" },
	{ label: "Em Negociação", value: "in_negotiation" },
	{ label: "Ganho", value: "won" },
	{ label: "Perdido", value: "lost" }
]

export const SimulationsTableToolbar = <TData,>({ table }: SimulationsTableToolbarProps<TData>) => {
	const isFiltered = table.getState().columnFilters.length > 0

	const uniqueCities = useMemo(() => {
		const cities = new Set<string>()
		table.getCoreRowModel().rows.forEach((row) => {
			const city = (row.original as SimulationWithRelations).city
			if (city) cities.add(city)
		})
		return Array.from(cities).map((city) => ({ label: city, value: city }))
	}, [table.getCoreRowModel().rows])

	const uniqueStates = useMemo(() => {
		const states = new Set<string>()
		table.getCoreRowModel().rows.forEach((row) => {
			const state = (row.original as SimulationWithRelations).state
			if (state) states.add(state)
		})
		return Array.from(states).map((state) => ({ label: state, value: state }))
	}, [table.getCoreRowModel().rows])

	const uniquePartners = useMemo(() => {
		const partners = new Set<string>()
		table.getCoreRowModel().rows.forEach((row) => {
			const partner = (row.original as SimulationWithRelations).partner_name
			if (partner) partners.add(partner)
		})
		return Array.from(partners).map((partner) => ({ label: partner, value: partner }))
	}, [table.getCoreRowModel().rows])

	const uniqueManagers = useMemo(() => {
		const managers = new Set<string>()
		table.getCoreRowModel().rows.forEach((row) => {
			const manager = (row.original as SimulationWithRelations).internal_manager
			if (manager) managers.add(manager)
		})
		return Array.from(managers).map((manager) => ({ label: manager, value: manager }))
	}, [table.getCoreRowModel().rows])

	const uniqueCreators = useMemo(() => {
		const creators = new Set<string>()
		table.getCoreRowModel().rows.forEach((row) => {
			const createdBy = (row.original as SimulationWithRelations).created_by_user
			if (createdBy) creators.add(createdBy)
		})
		return Array.from(creators).map((creator) => ({ label: creator, value: creator }))
	}, [table.getCoreRowModel().rows])

	const createdAtFilter = (table.getColumn("created_at")?.getFilterValue() as { from?: string; to?: string }) ?? {}

	return (
		<div className="space-y-2">
			{/* Campo de busca - primeira linha */}
			<div className="w-full">
				<Input
					placeholder="Filtrar por Razão Social..."
					value={(table.getColumn("company_name")?.getFilterValue() as string) ?? ""}
					onChange={(event) => table.getColumn("company_name")?.setFilterValue(event.target.value)}
					className="h-8 sm:w-[250px] max-w-full lg:w-[300px]"
				/>
			</div>

			{/* Todos os filtros lado a lado com quebra automática */}
			<div className="flex flex-wrap items-center gap-2">
				{table.getColumn("state") && <DataTableFacetedFilter column={table.getColumn("state")} title="Estado" options={uniqueStates} />}

				{table.getColumn("city") && <DataTableFacetedFilter column={table.getColumn("city")} title="Cidade" options={uniqueCities} />}

				{table.getColumn("partner_name") && <DataTableFacetedFilter column={table.getColumn("partner_name")} title="Parceiro" options={uniquePartners} />}

				{table.getColumn("internal_manager") && (
					<DataTableFacetedFilter column={table.getColumn("internal_manager")} title="Gestor Interno" options={uniqueManagers} />
				)}

				{table.getColumn("status") && <DataTableFacetedFilter column={table.getColumn("status")} title="Status" options={statusOptions} />}

				{table.getColumn("created_by_user") && (
					<DataTableFacetedFilter column={table.getColumn("created_by_user")} title="Criado por" options={uniqueCreators} />
				)}

				{/* Filtro de data inline com os outros */}
				{table.getColumn("created_at") && (
					<div className="flex items-center gap-2">
						<Input
							type="date"
							className="h-8 w-[150px]"
							value={createdAtFilter.from ?? ""}
							onChange={(e) =>
								table.getColumn("created_at")?.setFilterValue({
									...createdAtFilter,
									from: e.target.value || undefined
								})
							}
						/>
						<span className="text-xs text-muted-foreground">até</span>
						<Input
							type="date"
							className="h-8 w-[150px]"
							value={createdAtFilter.to ?? ""}
							onChange={(e) =>
								table.getColumn("created_at")?.setFilterValue({
									...createdAtFilter,
									to: e.target.value || undefined
								})
							}
						/>
					</div>
				)}

				{/* Botão limpar junto com os filtros */}
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
