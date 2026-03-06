"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import type { Seller, SellerStatus } from "@/lib/definitions/sellers"
import { formatCpf, formatPhone } from "@/lib/formatters"
import { cn, formatDate } from "@/lib/utils"
import { SellerActions } from "./seller-table-actions"

const statusVariant: { [key in SellerStatus]: "default" | "secondary" | "destructive" } = {
	approved: "default",
	pending: "secondary",
	rejected: "destructive"
}

const statusTranslations: { [key in SellerStatus]: string } = {
	approved: "Aprovado",
	pending: "Ag. Aprovação",
	rejected: "Negado"
}

export const columns: ColumnDef<Seller>[] = [
	{
		id: "select",
		header: ({ table }) => (
			<Checkbox
				checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
				onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
				aria-label="Select all"
			/>
		),
		cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" />,
		enableSorting: false,
		enableHiding: false
	},
	{
		accessorKey: "name",
		header: ({ column }) => {
			return (
				<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
					Nome
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			)
		},
		cell: ({ row }) => <div className="text-left">{row.getValue("name")}</div>
	},
	{
		accessorKey: "email",
		header: "Email",
		cell: ({ row }) => <div className="text-left">{row.getValue("email")}</div>
	},
	{
		accessorKey: "cpf",
		header: "CPF",
		cell: ({ row }) => formatCpf(row.original.cpf)
	},
	{
		accessorKey: "phone",
		header: "Celular",
		cell: ({ row }) => formatPhone(row.original.phone)
	},
	{
		accessorKey: "created_at",
		header: ({ column }) => {
			return (
				<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
					Data de Cadastro
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			)
		},
		cell: ({ row }) => {
			return formatDate(row.getValue("created_at"))
		}
	},
	{
		accessorKey: "status",
		header: ({ column }) => (
			<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
				Status
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => {
			const status = row.getValue("status") as SellerStatus
			return <Badge variant={statusVariant[status]}>{statusTranslations[status]}</Badge>
		},
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id))
		}
	},
	{
		accessorKey: "is_active",
		header: ({ column }) => (
			<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
				Ativo
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => {
			const isActive = row.getValue("is_active") as boolean
			return (
				<div className="flex items-center gap-2">
					<div className={cn("h-2 w-2 rounded-full", isActive ? "bg-green-500" : "bg-slate-400")} />
					<span>{isActive ? "Ativo" : "Inativo"}</span>
				</div>
			)
		},
		filterFn: (row, id, value) => {
			const isActive = row.getValue(id) as boolean
			return value.includes(String(isActive))
		}
	},
	{
		accessorKey: "city",
		header: "Cidade",
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id))
		}
	},
	{
		accessorKey: "state",
		header: "Estado",
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id))
		}
	},
	{
		id: "actions",
		cell: ({ row }) => <SellerActions seller={row.original} />
	}
]
