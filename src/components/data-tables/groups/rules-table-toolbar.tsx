"use client"

import type { Table } from "@tanstack/react-table"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DataTableFacetedFilter } from "@/components/ui/data-table-faceted-filter"
import { Input } from "@/components/ui/input"

interface RulesTableToolbarProps<TData> {
	table: Table<TData>
}

const ruleTypeOptions = [
	{ value: "include", label: "Incluir" },
	{ value: "exclude", label: "Excluir" }
]

export const RulesTableToolbar = <TData,>({ table }: RulesTableToolbarProps<TData>) => {
	const partnerFilterValue = (table.getColumn("partnerName")?.getFilterValue() as string) ?? ""
	const hasFilters =
		Boolean(partnerFilterValue) ||
		(table.getState().columnFilters ?? []).some((filter) => filter.id === "rule_type" && filter.value && (filter.value as unknown[]).length > 0)

	return (
		<div className="flex items-center justify-between">
			<div className="flex flex-1 flex-wrap items-center gap-2">
				<Input
					placeholder="Pesquisar por parceiro..."
					value={partnerFilterValue}
					onChange={(event) => table.getColumn("partnerName")?.setFilterValue(event.target.value)}
					className="h-8 w-full md:w-[250px]"
				/>
				{table.getColumn("rule_type") && <DataTableFacetedFilter column={table.getColumn("rule_type")} title="Tipo" options={ruleTypeOptions} />}
				{hasFilters && (
					<Button variant="ghost" onClick={() => table.resetColumnFilters()} className="h-8 px-2 lg:px-3">
						Limpar
						<X className="ml-2 h-4 w-4" />
					</Button>
				)}
			</div>
		</div>
	)
}
