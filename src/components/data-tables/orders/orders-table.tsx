"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { ViewOrderSheet } from "@/components/dialogs/view-order-sheet"
import {
	getCoreRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable
} from "@tanstack/react-table"
import type { ColumnFiltersState, PaginationState, SortingState, VisibilityState } from "@tanstack/react-table"

import { getOrdersPaginated, type OrdersFilter } from "@/actions/orders/get-orders-paginated"
import { createOrderColumns } from "@/components/data-tables/orders/orders-columns"
import { OrdersTableToolbar } from "@/components/data-tables/orders/orders-table-toolbar"
import { DataTable } from "@/components/ui/data-table"
import { DataTableSkeleton } from "@/components/ui/data-table-skeleton"
import { DataTableViewOptions } from "@/components/ui/data-table-view-options"
import { usePersistedTableState } from "@/hooks/use-persisted-table-state"

export const OrdersTable = ({
	filterId,
	filterType,
	dateFrom,
	dateTo,
	filterStatus
}: {
	filterId?: string
	filterType?: "pf" | "pj"
	dateFrom?: string
	dateTo?: string
	filterStatus?: string
}) => {
	// Estado da tabela com persistência
	const { sorting, setSorting, columnVisibility, setColumnVisibility } = usePersistedTableState({
		storageKey: `meo-table-orders${filterType ? `-${filterType}` : ""}`,
		initialState: {
			sorting: [{ id: "created_at", desc: true }],
			columnVisibility: {}
		}
	})
	const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })

	// Filtros server-side
	const [searchFilter, setSearchFilter] = useState("")
	const [statusFilter, setStatusFilter] = useState<string[]>(filterStatus ? [filterStatus] : [])
	const [stateFilter, setStateFilter] = useState<string[]>([])
	const [cityFilter, setCityFilter] = useState<string[]>([])
	const [partnerFilter, setPartnerFilter] = useState<string[]>([])
	const [managerFilter, setManagerFilter] = useState<string[]>([])
	const [creatorFilter, setCreatorFilter] = useState<string[]>([])
	const [dateFromFilter, setDateFromFilter] = useState(dateFrom || "")
	const [dateToFilter, setDateToFilter] = useState(dateTo || "")

	// Debounce do search
	const [debouncedSearch, setDebouncedSearch] = useState("")
	useEffect(() => {
		const timer = setTimeout(() => setDebouncedSearch(searchFilter), 300)
		return () => clearTimeout(timer)
	}, [searchFilter])

	// Supabase Realtime: refresh when orders are updated (e.g. status change from RevoCred)
	const queryClientRT = useQueryClient()
	useEffect(() => {
		const supabase = createClient()
		const channel = supabase
			.channel("orders-realtime")
			.on(
				"postgres_changes",
				{
					event: "UPDATE",
					schema: "public",
					table: "orders",
				},
				() => {
					// Invalidate orders queries to refresh the table
					queryClientRT.invalidateQueries({ queryKey: ["orders-paginated"] })
					queryClientRT.invalidateQueries({ queryKey: ["orders"] })
					queryClientRT.invalidateQueries({ queryKey: ["dashboard-stats"] })
				}
			)
			.subscribe()

		return () => {
			supabase.removeChannel(channel)
		}
	}, [queryClientRT])

	// Resetar página ao mudar filtros
	useEffect(() => {
		setPagination((prev) => ({ ...prev, pageIndex: 0 }))
	}, [debouncedSearch, statusFilter, stateFilter, cityFilter, partnerFilter, managerFilter, creatorFilter, dateFromFilter, dateToFilter, filterType])

	// Montar objeto de filtros para o server
	const serverFilters: OrdersFilter = useMemo(
		() => ({
			search: debouncedSearch || undefined,
			type: filterType,
			status: statusFilter.length > 0 ? statusFilter as any : undefined,
			state: stateFilter.length > 0 ? stateFilter : undefined,
			city: cityFilter.length > 0 ? cityFilter : undefined,
			partnerName: partnerFilter.length > 0 ? partnerFilter : undefined,
			internalManager: managerFilter.length > 0 ? managerFilter : undefined,
			createdByUser: creatorFilter.length > 0 ? creatorFilter : undefined,
			dateFrom: dateFromFilter || undefined,
			dateTo: dateToFilter || undefined
		}),
		[debouncedSearch, filterType, statusFilter, stateFilter, cityFilter, partnerFilter, managerFilter, creatorFilter, dateFromFilter, dateToFilter]
	)

	// Sorting para o server
	const sortBy = sorting[0]?.id || "created_at"
	const sortDesc = sorting[0]?.desc ?? true

	// Query com paginação server-side
	const { data: result, isLoading } = useQuery({
		queryKey: ["orders-paginated", pagination.pageIndex, pagination.pageSize, serverFilters, sortBy, sortDesc],
		queryFn: () => getOrdersPaginated(pagination.pageIndex, pagination.pageSize, serverFilters, sortBy, sortDesc),
		refetchInterval: 30_000,
		refetchIntervalInBackground: false
	})

	const data = result?.data ?? []
	const totalCount = result?.totalCount ?? 0
	const facets = result?.facets ?? { states: [], cities: [], partners: [], managers: [], creators: [] }
	const pageCount = Math.ceil(totalCount / pagination.pageSize)

	const columns = useMemo(() => createOrderColumns(filterType), [filterType])

	const table = useReactTable({
		data,
		columns,
		state: {
			sorting,
			columnVisibility,
			pagination
		},
		pageCount,
		onSortingChange: setSorting,
		onColumnVisibilityChange: setColumnVisibility,
		onPaginationChange: setPagination,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		manualPagination: true,
		manualFiltering: true
	})

	const isPF = filterType === "pf"

	const columnNameMap: { [key: string]: string } = {
		kdi: "KDI",
		cnpj: isPF ? "CPF" : "CNPJ",
		company_name: isPF ? "Nome" : "Razão Social",
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

	// Callback para limpar todos os filtros
	const handleClearFilters = useCallback(() => {
		setSearchFilter("")
		setStatusFilter([])
		setStateFilter([])
		setCityFilter([])
		setPartnerFilter([])
		setManagerFilter([])
		setCreatorFilter([])
		setDateFromFilter("")
		setDateToFilter("")
	}, [])

	const hasActiveFilters = !!(
		searchFilter ||
		statusFilter.length > 0 ||
		stateFilter.length > 0 ||
		cityFilter.length > 0 ||
		partnerFilter.length > 0 ||
		managerFilter.length > 0 ||
		creatorFilter.length > 0 ||
		dateFromFilter ||
		dateToFilter
	)

	const toolbar = (
		<div className="flex items-center justify-between">
			<OrdersTableToolbar
				searchFilter={searchFilter}
				onSearchChange={setSearchFilter}
				statusFilter={statusFilter}
				onStatusChange={setStatusFilter}
				stateFilter={stateFilter}
				onStateChange={setStateFilter}
				cityFilter={cityFilter}
				onCityChange={setCityFilter}
				partnerFilter={partnerFilter}
				onPartnerChange={setPartnerFilter}
				managerFilter={managerFilter}
				onManagerChange={setManagerFilter}
				creatorFilter={creatorFilter}
				onCreatorChange={setCreatorFilter}
				dateFromFilter={dateFromFilter}
				onDateFromChange={setDateFromFilter}
				dateToFilter={dateToFilter}
				onDateToChange={setDateToFilter}
				facets={facets}
				hasActiveFilters={hasActiveFilters}
				onClearFilters={handleClearFilters}
			/>
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

	if (isLoading && data.length === 0) {
		return <DataTableSkeleton columnCount={columns.length} />
	}

	return (
		<>
			<DataTable table={table} toolbar={toolbar} totalCount={totalCount} />
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
