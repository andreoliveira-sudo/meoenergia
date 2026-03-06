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
import { useMemo, useState } from "react"

import { getGroupRulesAction } from "@/actions/groups"
import { DataTable } from "@/components/ui/data-table"
import { DataTableSkeleton } from "@/components/ui/data-table-skeleton"
import { DataTableViewOptions } from "@/components/ui/data-table-view-options"

import { rulesColumns } from "./rules-columns"
import { RulesTableToolbar } from "./rules-table-toolbar"
import type { GroupRuleRow } from "./types"

interface RulesTableProps {
	groupId: string
}

export const RulesTable = ({ groupId }: RulesTableProps) => {
	const [sorting, setSorting] = useState<SortingState>([{ id: "created_at", desc: true }])
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

	const { data, isLoading } = useQuery<GroupRuleRow[]>({
		queryKey: ["group-rules", groupId],
		queryFn: async () => {
			const response = await getGroupRulesAction(groupId)

			if (!response.success) {
				throw new Error(response.message)
			}

			return response.data.map((rule) => ({
				id: rule.id,
				rule_type: rule.rule_type,
				created_at: rule.created_at,
				groupId,
				partnerId: rule.partner?.id ?? null,
				partnerName: rule.partner?.legal_business_name ?? "-"
			}))
		},
		enabled: Boolean(groupId),
		retry: false
	})

	const tableData = useMemo(() => data ?? [], [data])

	const table = useReactTable({
		data: tableData,
		columns: rulesColumns,
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

	const columnNameMap: Record<string, string> = {
		rule_type: "Tipo",
		partnerName: "Parceiro",
		created_at: "Criado em",
		actions: "Acoes"
	}

	const toolbar = (
		<div className="flex items-center justify-between">
			<RulesTableToolbar table={table} />
			<DataTableViewOptions table={table} columnNameMap={columnNameMap} />
		</div>
	)

	if (isLoading) {
		return <DataTableSkeleton columnCount={rulesColumns.length} />
	}

	return <DataTable table={table} toolbar={toolbar} emptyStateMessage="Nenhuma regra encontrada" />
}
