"use client"

import type { Table } from "@tanstack/react-table"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface MembersTableToolbarProps<TData> {
	table: Table<TData>
}

export const MembersTableToolbar = <TData,>({ table }: MembersTableToolbarProps<TData>) => {
	const filterValue = (table.getColumn("name")?.getFilterValue() as string) ?? ""
	const isFiltered = Boolean(filterValue)

	return (
		<div className="flex items-center justify-between">
			<div className="flex flex-1 flex-wrap items-center gap-2">
				<Input
					placeholder="Pesquisar por nome ou email..."
					value={filterValue}
					onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
					className="h-8 w-full md:w-[250px]"
				/>
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
