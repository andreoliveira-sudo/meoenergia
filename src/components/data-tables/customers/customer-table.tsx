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

import getCustomersForCurrentUser from "@/actions/customers/get-customers-for-current-user"
import { columns } from "@/components/data-tables/customers/columns"
import { CustomerTableToolbar } from "@/components/data-tables/customers/customer-table-toolbar"
import { DataTable } from "@/components/ui/data-table"
import { DataTableSkeleton } from "@/components/ui/data-table-skeleton"
import { DataTableViewOptions } from "@/components/ui/data-table-view-options"
import { usePersistedTableState } from "@/hooks/use-persisted-table-state"

const CUSTOMER_TABLE_STORAGE_KEY = "customer-table-state"

export const CustomerTable = () => {
	const { sorting, setSorting, columnFilters, setColumnFilters, columnVisibility, setColumnVisibility } = usePersistedTableState({
		storageKey: CUSTOMER_TABLE_STORAGE_KEY,
		initialState: {
			sorting: [{ id: "kdi", desc: true }]
		}
	})

	const { data, isLoading } = useQuery({
		queryKey: ["customers"],
		queryFn: getCustomersForCurrentUser
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
		company_name: "Razão Social",
		cnpj: "CNPJ",
		partner_name: "Parceiro",
		internal_manager_name: "Gestor Interno",
		city: "Cidade",
		state: "Estado"
	}

	const toolbar = (
		<div className="flex items-center justify-between">
			<CustomerTableToolbar table={table} />
			<DataTableViewOptions table={table} columnNameMap={columnNameMap} />
		</div>
	)

	if (isLoading) {
		return <DataTableSkeleton columnCount={columns.length} />
	}

	return <DataTable table={table} toolbar={toolbar} />
}
