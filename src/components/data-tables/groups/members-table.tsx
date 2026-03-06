"use client"

import { useQuery } from "@tanstack/react-query"
import { type ColumnFiltersState, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, useReactTable } from "@tanstack/react-table"
import { useMemo, useState } from "react"

import { getGroupMembersAction } from "@/actions/groups"
import { DataTable } from "@/components/ui/data-table"
import { DataTableSkeleton } from "@/components/ui/data-table-skeleton"

import { columns } from "./columns"
import { MembersTableToolbar } from "./members-table-toolbar"
import type { GroupMemberRow } from "./types"

interface MembersTableProps {
	groupId: string
}

export const MembersTable = ({ groupId }: MembersTableProps) => {
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

	const { data, isLoading } = useQuery<GroupMemberRow[]>({
		queryKey: ["group-members", groupId],
		queryFn: async () => {
			const result = await getGroupMembersAction(groupId)

			if (!result.success) {
				throw new Error(result.message)
			}

			return result.data.map((member) => ({
				...member,
				groupId
			}))
		},
		enabled: Boolean(groupId),
		retry: false
	})

	const tableData = useMemo(() => data ?? [], [data])

	const table = useReactTable({
		data: tableData,
		columns,
		state: {
			columnFilters
		},
		onColumnFiltersChange: setColumnFilters,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel()
	})

	const toolbar = <MembersTableToolbar table={table} />

	if (isLoading) {
		return <DataTableSkeleton columnCount={columns.length} />
	}

	return <DataTable table={table} toolbar={toolbar} emptyStateMessage="Nenhum membro encontrado" />
}
