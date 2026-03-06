"use client"

import type { Table } from "@tanstack/react-table"
import { X } from "lucide-react"
import { useMemo } from "react"

import { Button } from "@/components/ui/button"
import { DataTableFacetedFilter } from "@/components/ui/data-table-faceted-filter"
import { Input } from "@/components/ui/input"
import type { OrderWithRelations } from "@/lib/definitions/orders"

interface OrdersTableToolbarProps<TData> {
	table: Table<TData>
}

const statusOptions = [
	{ label: "Ag. Análise", value: "analysis_pending" },
	{ label: "Análise Prévia", value: "pre_analysis" },
	{ label: "Em Confirmação", value: "confirmation_pending" },
	{ label: "Análise de Crédito", value: "credit_analysis" },
	{ label: "Ag. Documentos", value: "documents_pending" },
	{ label: "Análise Docs", value: "docs_analysis" },
	{ label: "Análise Final", value: "final_analysis" },
	{ label: "Aprovado", value: "approved" },
	{ label: "Reprovado", value: "rejected" },
	{ label: "Assinatura Contrato", value: "contract_signing" },
	{ label: "Finalizado", value: "completed" },
	{ label: "Cancelado", value: "canceled" },
	{ label: "Pré-Aprovado", value: "pre_approved" },
	{ label: "Pré-Aprovado (Laranja)", value: "pre_approved_orange" },
	{ label: "Congelado", value: "frozen" }
]

export const OrdersTableToolbar = <TData,>({ table }: OrdersTableToolbarProps<TData>) => {
	const isFiltered = table.getState().columnFilters.length > 0

	const uniqueCities = useMemo(() => {
		const cities = new Set<string>()
		table.getCoreRowModel().rows.forEach((row) => {
			const city = (row.original as OrderWithRelations).city
			if (city) cities.add(city)
		})
		return Array.from(cities).map((city) => ({ label: city, value: city }))
	}, [table.getCoreRowModel().rows])

	const uniqueStates = useMemo(() => {
		const states = new Set<string>()
		table.getCoreRowModel().rows.forEach((row) => {
			const state = (row.original as OrderWithRelations).state
			if (state) states.add(state)
		})
		return Array.from(states).map((state) => ({ label: state, value: state }))
	}, [table.getCoreRowModel().rows])

	const uniquePartners = useMemo(() => {
		const partners = new Set<string>()
		table.getCoreRowModel().rows.forEach((row) => {
			const partner = (row.original as OrderWithRelations).partner_name
			if (partner) partners.add(partner)
		})
		return Array.from(partners).map((partner) => ({ label: partner, value: partner }))
	}, [table.getCoreRowModel().rows])

	const uniqueManagers = useMemo(() => {
		const managers = new Set<string>()
		table.getCoreRowModel().rows.forEach((row) => {
			const manager = (row.original as OrderWithRelations).internal_manager
			if (manager) managers.add(manager)
		})
		return Array.from(managers).map((manager) => ({ label: manager, value: manager }))
	}, [table.getCoreRowModel().rows])

	const uniqueCreators = useMemo(() => {
		const creators = new Set<string>()
		table.getCoreRowModel().rows.forEach((row) => {
			const createdBy = (row.original as OrderWithRelations).created_by_user
			if (createdBy) creators.add(createdBy)
		})
		return Array.from(creators).map((creator) => ({ label: creator, value: creator }))
	}, [table.getCoreRowModel().rows])

	const createdAtFilter = (table.getColumn("created_at")?.getFilterValue() as { from?: string; to?: string }) ?? {}

	return (
		<div className="flex items-center justify-between">
			<div className="flex flex-1 flex-wrap items-center gap-2">
				<Input
					placeholder="Filtrar por Cliente..."
					value={(table.getColumn("customer_name")?.getFilterValue() as string) ?? ""}
					onChange={(event) => table.getColumn("customer_name")?.setFilterValue(event.target.value)}
					className="h-8 w-[150px] lg:w-[250px]"
				/>

				{/* Estado */}
				{table.getColumn("state") && <DataTableFacetedFilter column={table.getColumn("state")} title="Estado" options={uniqueStates} />}

				{/* Cidade */}
				{table.getColumn("city") && <DataTableFacetedFilter column={table.getColumn("city")} title="Cidade" options={uniqueCities} />}

				{/* Parceiro */}
				{table.getColumn("partner_name") && <DataTableFacetedFilter column={table.getColumn("partner_name")} title="Parceiro" options={uniquePartners} />}

				{/* Gestor Interno */}
				{table.getColumn("internal_manager") && (
					<DataTableFacetedFilter column={table.getColumn("internal_manager")} title="Gestor Interno" options={uniqueManagers} />
				)}

				{/* 👇 NOVO: Status */}
				{table.getColumn("status") && <DataTableFacetedFilter column={table.getColumn("status")} title="Status" options={statusOptions} />}

				{/* 👇 NOVO: Criado por */}
				{table.getColumn("created_by_user") && (
					<DataTableFacetedFilter column={table.getColumn("created_by_user")} title="Criado por" options={uniqueCreators} />
				)}

				{/* 👇 NOVO: intervalo de datas (created_at) */}
				{table.getColumn("created_at") && (
					<div className="flex items-center gap-2">
						<Input
							type="date"
							className="h-8 w-[140px]"
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
							className="h-8 w-[140px]"
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
