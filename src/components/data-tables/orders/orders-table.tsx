"use client"

import { useQuery } from "@tanstack/react-query"
import { useEffect, useMemo, useState } from "react"
import { ViewOrderSheet } from "@/components/dialogs/view-order-sheet"
import {
	getCoreRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable
} from "@tanstack/react-table"

import { getOrdersForCurrentUser } from "@/actions/orders"
import { columns } from "@/components/data-tables/orders/orders-columns"
import { OrdersTableToolbar } from "@/components/data-tables/orders/orders-table-toolbar"
import { DataTable } from "@/components/ui/data-table"
import { DataTableSkeleton } from "@/components/ui/data-table-skeleton"
import { DataTableViewOptions } from "@/components/ui/data-table-view-options"
import { usePersistedTableState } from "@/hooks/use-persisted-table-state"

const ORDERS_TABLE_STORAGE_KEY = "orders-table-state"

export const OrdersTable = ({ filterId, filterType }: { filterId?: string; filterType?: "pf" | "pj" }) => {
	const { sorting, setSorting, columnFilters, setColumnFilters, columnVisibility, setColumnVisibility } = usePersistedTableState({
		storageKey: ORDERS_TABLE_STORAGE_KEY,
		initialState: {
			sorting: [{ id: "created_at", desc: true }],
			columnVisibility: {
				status: false
			},
			columnFilters: filterId ? [{ id: "id", value: filterId }] : []
		}
	})

	const { data: rawData, isLoading } = useQuery({
		queryKey: ["orders"],
		queryFn: getOrdersForCurrentUser,
		staleTime: 5 * 60 * 1000, // 5 minutos - evita refetch a cada navegação
		refetchOnMount: false
	})

	const data = useMemo(() => (filterType ? (rawData ?? []).filter((order) => order.customer_type === filterType) : (rawData ?? [])), [rawData, filterType])

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
			<OrdersTableToolbar table={table} />
			<DataTableViewOptions table={table} columnNameMap={columnNameMap} />
		</div>
	)

	// Auto-open logic for deep linking
	const [viewOrderId, setViewOrderId] = useState<string | null>(null)
	const [isViewSheetOpen, setIsViewSheetOpen] = useState(false)

	useEffect(() => {
		if (filterId) {
			setViewOrderId(filterId)
			setIsViewSheetOpen(true)
		}
	}, [filterId])

	if (isLoading) {
		return <DataTableSkeleton columnCount={columns.length} />
	}

	return (
		<>
			<DataTable table={table} toolbar={toolbar} />
			{viewOrderId && (
				<ViewOrderSheet
					orderId={viewOrderId}
					open={isViewSheetOpen}
					onOpenChange={(open) => {
						setIsViewSheetOpen(open)
						if (!open) setViewOrderId(null)
					}}
				/>
			)}
		</>
	)
}
