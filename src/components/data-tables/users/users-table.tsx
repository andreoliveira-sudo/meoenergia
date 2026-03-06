"use client"

import { useQuery } from "@tanstack/react-query"
import {
	type ColumnFiltersState,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
	type VisibilityState
} from "@tanstack/react-table"
import { useEffect, useMemo, useState } from "react"

import { hasPermission } from "@/actions/auth"
import { getAllUsers } from "@/actions/users"
import { columns } from "@/components/data-tables/users/users-columns"
import { DataTable } from "@/components/ui/data-table"
import { DataTableSkeleton } from "@/components/ui/data-table-skeleton"
import { Input } from "@/components/ui/input"

const UsersTable = () => {
	const [sorting, setSorting] = useState<SortingState>([{ id: "created_at", desc: true }])
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
		id: false
	})
	const [canManageUsers, setCanManageUsers] = useState(false)

	useEffect(() => {
		const checkPermissions = async () => {
			const permission = await hasPermission("admin:users:manage")
			setCanManageUsers(permission)
		}
		checkPermissions()
	}, [])

	const { data, isLoading } = useQuery({
		queryKey: ["users"],
		queryFn: getAllUsers
	})

	const tableColumns = useMemo(() => columns(canManageUsers), [canManageUsers])

	const table = useReactTable({
		data: data ?? [],
		columns: tableColumns,
		state: {
			sorting,
			columnFilters,
			columnVisibility
		},
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel()
	})

	if (isLoading) {
		return <DataTableSkeleton columnCount={4} />
	}

	const toolbar = (
		<div className="flex items-center justify-between">
			<div className="flex flex-1 items-center space-x-2">
				<Input
					placeholder="Filtrar por email..."
					value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
					onChange={(event) => table.getColumn("email")?.setFilterValue(event.target.value)}
					className="h-8 w-[150px] lg:w-[250px]"
				/>
			</div>
		</div>
	)

	return <DataTable table={table} toolbar={toolbar} />
}

export { UsersTable }
