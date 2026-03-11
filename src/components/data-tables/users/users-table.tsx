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
import { CheckCircle2, Lock, Power, PowerOff, Search, Users, UserCheck, UserX, ShieldCheck } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { hasPermission } from "@/actions/auth"
import { getAllUsers } from "@/actions/users"
import { columns } from "@/components/data-tables/users/users-columns"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { DataTableSkeleton } from "@/components/ui/data-table-skeleton"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const UsersTable = () => {
	const [sorting, setSorting] = useState<SortingState>([{ id: "created_at", desc: true }])
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
		id: false
	})
	const [canManageUsers, setCanManageUsers] = useState(false)
	const [statusFilter, setStatusFilter] = useState<string>("all")
	const [roleFilter, setRoleFilter] = useState<string>("all")
	const [accessFilter, setAccessFilter] = useState<string>("all")

	useEffect(() => {
		const checkPermissions = async () => {
			const permission = await hasPermission("admin:users:manage")
			setCanManageUsers(permission)
		}
		checkPermissions()
	}, [])

	const { data, isLoading } = useQuery({
		queryKey: ["users"],
		queryFn: getAllUsers,
		refetchInterval: 30_000,
		refetchIntervalInBackground: false
	})

	// Dados filtrados por status, role e acesso
	const filteredData = useMemo(() => {
		let result = data ?? []

		if (statusFilter === "active") {
			result = result.filter(u => u.is_active)
		} else if (statusFilter === "inactive") {
			result = result.filter(u => !u.is_active)
		}

		if (roleFilter !== "all") {
			result = result.filter(u => u.role === roleFilter)
		}

		if (accessFilter === "granted") {
			result = result.filter(u => u.has_system_access)
		} else if (accessFilter === "blocked") {
			result = result.filter(u => !u.has_system_access)
		}

		return result
	}, [data, statusFilter, roleFilter, accessFilter])

	// Estatísticas
	const stats = useMemo(() => {
		const all = data ?? []
		return {
			total: all.length,
			active: all.filter(u => u.is_active).length,
			inactive: all.filter(u => !u.is_active).length,
			withAccess: all.filter(u => u.has_system_access).length,
			withoutAccess: all.filter(u => !u.has_system_access).length,
		}
	}, [data])

	const tableColumns = useMemo(() => columns(canManageUsers), [canManageUsers])

	const table = useReactTable({
		data: filteredData,
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
		return <DataTableSkeleton columnCount={7} />
	}

	const hasFilters = statusFilter !== "all" || roleFilter !== "all" || accessFilter !== "all"

	const toolbar = (
		<div className="flex flex-col gap-4">
			{/* Estatísticas */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
				<div className="flex items-center gap-3 rounded-lg border bg-card p-3">
					<div className="rounded-md bg-blue-100 p-2">
						<Users className="h-4 w-4 text-blue-600" />
					</div>
					<div>
						<p className="text-xs text-muted-foreground">Total</p>
						<p className="text-lg font-bold">{stats.total}</p>
					</div>
				</div>
				<div className="flex items-center gap-3 rounded-lg border bg-card p-3">
					<div className="rounded-md bg-green-100 p-2">
						<UserCheck className="h-4 w-4 text-green-600" />
					</div>
					<div>
						<p className="text-xs text-muted-foreground">Ativos</p>
						<p className="text-lg font-bold text-green-600">{stats.active}</p>
					</div>
				</div>
				<div className="flex items-center gap-3 rounded-lg border bg-card p-3">
					<div className="rounded-md bg-emerald-100 p-2">
						<CheckCircle2 className="h-4 w-4 text-emerald-600" />
					</div>
					<div>
						<p className="text-xs text-muted-foreground">Com Acesso</p>
						<p className="text-lg font-bold text-emerald-600">{stats.withAccess}</p>
					</div>
				</div>
				<div className="flex items-center gap-3 rounded-lg border bg-card p-3">
					<div className="rounded-md bg-red-100 p-2">
						<Lock className="h-4 w-4 text-red-600" />
					</div>
					<div>
						<p className="text-xs text-muted-foreground">Sem Acesso</p>
						<p className="text-lg font-bold text-red-600">{stats.withoutAccess}</p>
					</div>
				</div>
			</div>

			{/* Filtros */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
				<div className="relative flex-1 w-full sm:max-w-[300px]">
					<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Buscar por email..."
						value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
						onChange={(event) => table.getColumn("email")?.setFilterValue(event.target.value)}
						className="h-9 pl-8"
					/>
				</div>

				<Select value={statusFilter} onValueChange={setStatusFilter}>
					<SelectTrigger className="h-9 w-full sm:w-[160px]">
						<SelectValue placeholder="Status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Todos os Status</SelectItem>
						<SelectItem value="active">
							<span className="flex items-center gap-2">
								<Power className="h-3 w-3 text-green-600" />
								Ativos
							</span>
						</SelectItem>
						<SelectItem value="inactive">
							<span className="flex items-center gap-2">
								<PowerOff className="h-3 w-3 text-red-600" />
								Inativos
							</span>
						</SelectItem>
					</SelectContent>
				</Select>

				<Select value={accessFilter} onValueChange={setAccessFilter}>
					<SelectTrigger className="h-9 w-full sm:w-[160px]">
						<SelectValue placeholder="Acesso" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Todos os Acessos</SelectItem>
						<SelectItem value="granted">
							<span className="flex items-center gap-2">
								<CheckCircle2 className="h-3 w-3 text-green-600" />
								Liberados
							</span>
						</SelectItem>
						<SelectItem value="blocked">
							<span className="flex items-center gap-2">
								<Lock className="h-3 w-3 text-red-600" />
								Sem Acesso
							</span>
						</SelectItem>
					</SelectContent>
				</Select>

				<Select value={roleFilter} onValueChange={setRoleFilter}>
					<SelectTrigger className="h-9 w-full sm:w-[160px]">
						<SelectValue placeholder="Função" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Todas as Funções</SelectItem>
						<SelectItem value="admin">Admin</SelectItem>
						<SelectItem value="seller">Vendedor</SelectItem>
						<SelectItem value="partner">Parceiro</SelectItem>
						<SelectItem value="staff">Staff</SelectItem>
					</SelectContent>
				</Select>

				{hasFilters && (
					<Badge
						variant="secondary"
						className="cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
						onClick={() => { setStatusFilter("all"); setRoleFilter("all"); setAccessFilter("all") }}
					>
						Limpar filtros
					</Badge>
				)}
			</div>
		</div>
	)

	return <DataTable table={table} toolbar={toolbar} />
}

export { UsersTable }
