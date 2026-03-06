"use client"

import { useQuery } from "@tanstack/react-query"
import {
	type ColumnFiltersState,
	getCoreRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
	type VisibilityState
} from "@tanstack/react-table"
import { useState } from "react"

import { getSellersForCurrentUser } from "@/actions/sellers"
import { columns } from "@/components/data-tables/sellers/columns"
import { SellerTableToolbar } from "@/components/data-tables/sellers/seller-table-toolbar"
import { DataTable } from "@/components/ui/data-table"
import { DataTableSkeleton } from "@/components/ui/data-table-skeleton"
import { DataTableViewOptions } from "@/components/ui/data-table-view-options"
import { usePersistedTableState } from "@/hooks/use-persisted-table-state"

const SELLER_TABLE_STORAGE_KEY = "seller-table-state"

const SellerTable = () => {
	const [rowSelection, setRowSelection] = useState({})

	const { sorting, setSorting, columnFilters, setColumnFilters, columnVisibility, setColumnVisibility } = usePersistedTableState({
		storageKey: SELLER_TABLE_STORAGE_KEY,
		initialState: {
			columnVisibility: {
				id: false,
				user_id: false,
				cep: false,
				street: false,
				number: false,
				complement: false,
				neighborhood: false,
				updated_at: false
			},
			sorting: [{ id: "created_at", desc: true }]
		}
	})

	const { data, isLoading } = useQuery({
		queryKey: ["sellers"],
		queryFn: getSellersForCurrentUser
	})

	const table = useReactTable({
		data: data ?? [],
		columns,
		state: {
			sorting,
			columnVisibility,
			rowSelection,
			columnFilters
		},
		enableRowSelection: true,
		onRowSelectionChange: setRowSelection,
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
		name: "Nome",
		email: "Email",
		cpf: "CPF",
		phone: "Celular",
		created_at: "Data de Cadastro",
		city: "Cidade",
		state: "Estado",
		status: "Status",
		is_active: "Ativo"
	}

	const toolbar = (
		<div className="flex items-center justify-between">
			<SellerTableToolbar table={table} />
			<DataTableViewOptions table={table} columnNameMap={columnNameMap} />
		</div>
	)

	if (isLoading) {
		return <DataTableSkeleton columnCount={6} />
	}

	return <DataTable table={table} toolbar={toolbar} />
}

export { SellerTable }
