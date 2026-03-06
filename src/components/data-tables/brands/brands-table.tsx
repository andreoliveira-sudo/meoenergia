"use client"

import { useQuery } from "@tanstack/react-query"
import {
	type ColumnFiltersState,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
	type VisibilityState
} from "@tanstack/react-table"
import { useState } from "react"

import { getAllBrands } from "@/actions/equipments"
import { DataTable } from "@/components/ui/data-table"
import { DataTableSkeleton } from "@/components/ui/data-table-skeleton"
import { Input } from "@/components/ui/input"
import type { EquipmentBrand } from "@/lib/definitions/equipments"
import { columns } from "./brands-columns"

const BrandsTable = () => {
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
		id: false,
		updated_at: false
	})
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
	const [sorting, setSorting] = useState<SortingState>([])

	const { data, isLoading } = useQuery<EquipmentBrand[]>({
		queryKey: ["brands"],
		queryFn: getAllBrands
	})

	const table = useReactTable({
		data: data ?? [],
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
		getSortedRowModel: getSortedRowModel()
	})

	if (isLoading) {
		return <DataTableSkeleton columnCount={columns.length} />
	}

	const toolbar = (
		<div className="flex items-center justify-between">
			<div className="flex flex-1 flex-wrap items-center gap-2">
				<Input
					placeholder="Filtrar por nome da marca..."
					value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
					onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
					className="h-8 w-full md:w-[250px]"
				/>
			</div>
		</div>
	)

	return <DataTable table={table} toolbar={toolbar} />
}

export { BrandsTable }
