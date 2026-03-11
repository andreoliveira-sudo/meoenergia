"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, CheckCircle2, Clock, Power, PowerOff, ShieldX, XCircle } from "lucide-react"

import { EditUserDataDialog } from "@/components/dialogs/edit-user-data-dialog"
import { EditUserPermissionsDialog } from "@/components/dialogs/edit-user-permissions-dialog"
import { ResetPasswordDialog } from "@/components/dialogs/reset-password-dialog"
import { ToggleUserStatusButton } from "@/components/data-tables/users/toggle-user-status-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { Database } from "@/lib/definitions/supabase"
import type { UserWithAccess } from "@/lib/definitions/users"
import { formatDate } from "@/lib/utils"

type UserRole = Database["public"]["Enums"]["user_role"]

const ActionsCell = ({ user, canManage }: { user: UserWithAccess; canManage: boolean }) => {
	if (!canManage) {
		return null
	}

	return (
		<div className="flex items-center gap-1">
			<EditUserDataDialog user={user} />
			<ResetPasswordDialog user={user} />
			<EditUserPermissionsDialog user={user} />
			<ToggleUserStatusButton user={user} />
		</div>
	)
}

const roleTranslations: Record<UserRole, string> = {
	admin: "Admin",
	seller: "Vendedor",
	partner: "Parceiro",
	staff: "Staff"
}

const roleVariant: Record<UserRole, "default" | "secondary" | "outline" | "destructive"> = {
	admin: "default",
	seller: "secondary",
	partner: "outline",
	staff: "secondary"
}

export const columns = (canManageUsers: boolean): ColumnDef<UserWithAccess>[] => [
	{
		accessorKey: "name",
		header: ({ column }) => (
			<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
				Nome
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => {
			const isActive = row.original.is_active
			const name = (row.getValue("name") as string) || ""
			return (
				<div className={`text-left font-medium ${!isActive ? "text-muted-foreground line-through" : ""}`}>
					{name.toUpperCase()}
				</div>
			)
		}
	},
	{
		accessorKey: "email",
		header: ({ column }) => (
			<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
				Email
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => {
			const isActive = row.original.is_active
			return (
				<div className={`text-left ${!isActive ? "text-muted-foreground" : ""}`}>
					{row.getValue("email")}
				</div>
			)
		}
	},
	{
		accessorKey: "role",
		header: "Função",
		cell: ({ row }) => {
			const role = row.getValue("role") as UserRole
			return <Badge variant={roleVariant[role]}>{roleTranslations[role]}</Badge>
		}
	},
	{
		accessorKey: "is_active",
		header: "Status",
		cell: ({ row }) => {
			const isActive = row.getValue("is_active") as boolean
			return (
				<Badge variant={isActive ? "default" : "destructive"} className={isActive ? "bg-green-600 hover:bg-green-700" : ""}>
					{isActive ? (
						<span className="flex items-center gap-1">
							<Power className="w-3 h-3" />
							Ativo
						</span>
					) : (
						<span className="flex items-center gap-1">
							<PowerOff className="w-3 h-3" />
							Inativo
						</span>
					)}
				</Badge>
			)
		}
	},
	{
		accessorKey: "has_system_access",
		header: "Acesso",
		cell: ({ row }) => {
			const hasAccess = row.original.has_system_access
			const reason = row.original.access_reason

			if (hasAccess) {
				return (
					<Tooltip>
						<TooltipTrigger>
							<Badge variant="outline" className="border-green-300 bg-green-50 text-green-700">
								<span className="flex items-center gap-1">
									<CheckCircle2 className="w-3 h-3" />
									Liberado
								</span>
							</Badge>
						</TooltipTrigger>
						<TooltipContent><p>{reason}</p></TooltipContent>
					</Tooltip>
				)
			}

			// Determinar ícone e cor por tipo de bloqueio
			let icon = <XCircle className="w-3 h-3" />
			let colorClasses = "border-red-300 bg-red-50 text-red-700"
			let label = "Bloqueado"

			if (reason === "Aguardando aprovação") {
				icon = <Clock className="w-3 h-3" />
				colorClasses = "border-amber-300 bg-amber-50 text-amber-700"
				label = "Pendente"
			} else if (reason === "Cadastro rejeitado") {
				icon = <ShieldX className="w-3 h-3" />
				colorClasses = "border-red-300 bg-red-50 text-red-700"
				label = "Rejeitado"
			} else if (reason === "Parceiro inativo" || reason === "Usuário desativado") {
				icon = <PowerOff className="w-3 h-3" />
				colorClasses = "border-gray-300 bg-gray-50 text-gray-600"
				label = "Desativado"
			}

			return (
				<Tooltip>
					<TooltipTrigger>
						<Badge variant="outline" className={colorClasses}>
							<span className="flex items-center gap-1">
								{icon}
								{label}
							</span>
						</Badge>
					</TooltipTrigger>
					<TooltipContent><p>{reason}</p></TooltipContent>
				</Tooltip>
			)
		}
	},
	{
		accessorKey: "created_at",
		header: ({ column }) => (
			<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
				Data de Criação
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => <div>{formatDate(row.getValue("created_at"))}</div>
	},
	{
		id: "actions",
		cell: ({ row }) => {
			return <ActionsCell user={row.original} canManage={canManageUsers} />
		}
	}
]
