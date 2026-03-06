"use client"

import { useQuery } from "@tanstack/react-query"
import {
	getCoreRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable
} from "@tanstack/react-table"

import { getSimulationsForCurrentUser } from "@/actions/simulations"
import { columns } from "@/components/data-tables/simulations/simulations-columns"
import { SimulationsTableToolbar } from "@/components/data-tables/simulations/simulations-table-toolbar"
import { DataTable } from "@/components/ui/data-table"
import { DataTableSkeleton } from "@/components/ui/data-table-skeleton"
import { DataTableViewOptions } from "@/components/ui/data-table-view-options"
import { usePersistedTableState } from "@/hooks/use-persisted-table-state"

const SIMULATIONS_TABLE_STORAGE_KEY = "simulations-table-state"

export const SimulationsTable = () => {
	const { sorting, setSorting, columnFilters, setColumnFilters, columnVisibility, setColumnVisibility } = usePersistedTableState({
		storageKey: SIMULATIONS_TABLE_STORAGE_KEY,
		initialState: {
			sorting: [{ id: "created_at", desc: true }],
			columnVisibility: {
				status: false
			}
		}
	})

	const { data, isLoading } = useQuery({
		queryKey: ["simulations"],
		queryFn: getSimulationsForCurrentUser
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
		getSortedRowModel: getSortedRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues()
	})

	const columnNameMap: { [key: string]: string } = {
		kdi: "KDI",
		cnpj: "CNPJ",
		company_name: "Razão Social",
		city: "Cidade",
		state: "Estado",
		partner_name: "Parceiro",
		internal_manager: "Gestor Interno",
		system_power: "Potência (kWp)",
		total_value: "Valor",
		status: "Status",
		created_by_user: "Criado por",
		created_at: "Data",
		actions: "Ações"
	}

	const toolbar = (
		<div className="flex items-center justify-between">
			<SimulationsTableToolbar table={table} />
			<DataTableViewOptions table={table} columnNameMap={columnNameMap} />
		</div>
	)

	if (isLoading) {
		return <DataTableSkeleton columnCount={columns.length} />
	}

	return <DataTable table={table} toolbar={toolbar} />
}
