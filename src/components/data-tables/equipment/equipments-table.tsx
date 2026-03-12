"use client"

import { useQuery } from "@tanstack/react-query"
import {
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable
} from "@tanstack/react-table"
import { getAllEquipments } from "@/actions/equipments"
import { DataTable } from "@/components/ui/data-table"
import { DataTableSkeleton } from "@/components/ui/data-table-skeleton"
import { Input } from "@/components/ui/input"
import { usePersistedTableState } from "@/hooks/use-persisted-table-state"
import type { EquipmentWithRelations } from "@/lib/definitions/equipments"
import { columns } from "./equipments-columns"

const EquipmentsTable = () => {
	const { sorting, setSorting, columnFilters, setColumnFilters, columnVisibility, setColumnVisibility } = usePersistedTableState({
		storageKey: "meo-table-equipments",
		initialState: {
			sorting: [{ id: "created_at", desc: true }],
			columnVisibility: {}
		}
	})

	const { data, isLoading } = useQuery<EquipmentWithRelations[]>({
		queryKey: ["equipments"],
		queryFn: getAllEquipments,
		refetchInterval: 30_000,
		refetchIntervalInBackground: false
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
					placeholder="Filtrar por nome do equipamento..."
					value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
					onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
					className="h-8 w-full md:w-[250px]"
				/>
			</div>
		</div>
	)

	return <DataTable table={table} toolbar={toolbar} />
}

export { EquipmentsTable }
