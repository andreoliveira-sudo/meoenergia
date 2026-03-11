"use client"

import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
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

export const CustomerTable = ({ filterType, dateFrom, dateTo }: { filterType?: "pf" | "pj"; dateFrom?: string; dateTo?: string }) => {
	const { sorting, setSorting, columnFilters, setColumnFilters, columnVisibility, setColumnVisibility } = usePersistedTableState({
		storageKey: CUSTOMER_TABLE_STORAGE_KEY,
		initialState: {
			sorting: [{ id: "kdi", desc: true }]
		}
	})

	const { data: rawData, isLoading } = useQuery({
		queryKey: ["customers"],
		queryFn: getCustomersForCurrentUser,
		refetchInterval: 30_000,
		refetchIntervalInBackground: false
	})

	const data = useMemo(() => {
		let filtered = rawData ?? []
		if (filterType) {
			filtered = filtered.filter((c) => c.type === filterType)
		}
		if (dateFrom || dateTo) {
			filtered = filtered.filter((c) => {
				if (!c.created_at) return false
				const d = new Date(c.created_at); const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
				if (dateFrom && dateStr < dateFrom) return false
				if (dateTo && dateStr > dateTo) return false
				return true
			})
		}
		return filtered
	}, [rawData, filterType, dateFrom, dateTo])

	const table = useReactTable({
		data,
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
		type: "Tipo",
		company_name: "Razão Social/Nome",
		cnpj: "CNPJ/CPF",
		created_at: "Data de Cadastro",
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
