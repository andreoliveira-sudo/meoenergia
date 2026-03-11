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
import { useMemo, useState } from "react"

import { getPartnersForCurrentUser } from "@/actions/partners"
import { columns } from "@/components/data-tables/partners/columns"
import { PartnerTableToolbar } from "@/components/data-tables/partners/partner-table-toolbar"
import { DataTable } from "@/components/ui/data-table"
import { DataTableSkeleton } from "@/components/ui/data-table-skeleton"
import { DataTableViewOptions } from "@/components/ui/data-table-view-options"
import { usePersistedTableState } from "@/hooks/use-persisted-table-state"

const PARTNER_TABLE_STORAGE_KEY = "partner-table-state"

const PartnerTable = ({ dateFrom, dateTo }: { dateFrom?: string; dateTo?: string }) => {
	const [rowSelection, setRowSelection] = useState({})

	const { sorting, setSorting, columnFilters, setColumnFilters, columnVisibility, setColumnVisibility } = usePersistedTableState({
		storageKey: PARTNER_TABLE_STORAGE_KEY,
		initialState: {
			columnVisibility: {
				id: false,
				user_id: false,
				seller_id: false,
				contact_email: false,
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

	const { data: rawData, isLoading } = useQuery({
		queryKey: ["partners"],
		queryFn: () => getPartnersForCurrentUser(),
		refetchInterval: 30_000,
		refetchIntervalInBackground: false
	})

	const data = useMemo(() => {
		let filtered = rawData ?? []
		if (dateFrom || dateTo) {
			filtered = filtered.filter((p) => {
				if (!p.created_at) return false
				const d = new Date(p.created_at); const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
				if (dateFrom && dateStr < dateFrom) return false
				if (dateTo && dateStr > dateTo) return false
				return true
			})
		}
		return filtered
	}, [rawData, dateFrom, dateTo])

	const table = useReactTable({
		data,
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
		kdi: "KDI",
		legal_business_name: "Razão Social",
		cnpj: "CNPJ",
		contact_name: "Responsável",
		contact_mobile: "Celular",
		created_at: "Data da Solicitação",
		is_active: "Ativo",
		status: "Status",
		seller_name: "Gestor Interno",
		city: "Cidade",
		state: "Estado",
		actions: "Ações"
	}

	const toolbar = (
		<div className="flex items-center justify-between">
			<PartnerTableToolbar table={table} />
			<DataTableViewOptions table={table} columnNameMap={columnNameMap} />
		</div>
	)

	if (isLoading) {
		return <DataTableSkeleton columnCount={6} />
	}

	return <DataTable table={table} toolbar={toolbar} />
}

export { PartnerTable }
