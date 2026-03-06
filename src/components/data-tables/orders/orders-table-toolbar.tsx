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

	// Compute all unique filter values in a single pass using stable data reference
	const { uniqueCities, uniqueStates, uniquePartners, uniqueManagers, uniqueCreators } = useMemo(() => {
		const cities = new Set<string>()
		const states = new Set<string>()
		const partners = new Set<string>()
		const managers = new Set<string>()
		const creators = new Set<string>()

		const data = table.options.data as OrderWithRelations[]
		for (const order of data) {
			if (order.city) cities.add(order.city)
			if (order.state) states.add(order.state)
			if (order.partner_name) partners.add(order.partner_name)
			if (order.internal_manager) managers.add(order.internal_manager)
			if (order.created_by_user) creators.add(order.created_by_user)
		}

		return {
			uniqueCities: Array.from(cities).map((v) => ({ label: v, value: v })),
			uniqueStates: Array.from(states).map((v) => ({ label: v, value: v })),
			uniquePartners: Array.from(partners).map((v) => ({ label: v, value: v })),
			uniqueManagers: Array.from(managers).map((v) => ({ label: v, value: v })),
			uniqueCreators: Array.from(creators).map((v) => ({ label: v, value: v }))
		}
	}, [table.options.data])

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

				{/* Status */}
				{table.getColumn("status") && <DataTableFacetedFilter column={table.getColumn("status")} title="Status" options={statusOptions} />}

				{/* Criado por */}
				{table.getColumn("created_by_user") && (
					<DataTableFacetedFilter column={table.getColumn("created_by_user")} title="Criado por" options={uniqueCreators} />
				)}

				{/* Intervalo de datas (created_at) */}
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
