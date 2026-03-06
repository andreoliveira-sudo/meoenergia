"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"

import { PartnerActions } from "@/components/data-tables/partners/partner-table-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { PartnerStatus, PartnerWithSellerName } from "@/lib/definitions/partners"
import { formatCnpj, formatPhone } from "@/lib/formatters"
import { cn, formatDate, getFirstAndLastName } from "@/lib/utils"

const statusVariant: { [key in PartnerStatus]: "default" | "secondary" | "destructive" } = {
	approved: "default",
	pending: "secondary",
	rejected: "destructive"
}

const statusTranslations: { [key in PartnerStatus]: string } = {
	approved: "Aprovado",
	pending: "Ag. Aprovação",
	rejected: "Negado"
}

export const columns: ColumnDef<PartnerWithSellerName>[] = [
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
		accessorKey: "kdi",
		header: "KDI"
	},
	{
		accessorKey: "legal_business_name",
		header: ({ column }) => {
			return (
				<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
					Razão Social
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			)
		},
		cell: ({ row }) => {
			const fullName = row.getValue("legal_business_name") as string
			return (
				<Tooltip>
					<TooltipTrigger asChild>
						<div className="font-medium text-left cursor-pointer">{getFirstAndLastName(fullName)}</div>
					</TooltipTrigger>
					<TooltipContent>
						<p>{fullName}</p>
					</TooltipContent>
				</Tooltip>
			)
		}
	},
	{
		accessorKey: "cnpj",
		header: "CNPJ",
		cell: ({ row }) => formatCnpj(row.getValue("cnpj"))
	},
	{
		accessorKey: "contact_name",
		header: "Responsável",
		cell: ({ row }) => {
			const fullName = row.getValue("contact_name") as string
			return (
				<Tooltip>
					<TooltipTrigger asChild>
						<div className="text-left cursor-pointer">{getFirstAndLastName(fullName)}</div>
					</TooltipTrigger>
					<TooltipContent>
						<p>{fullName}</p>
					</TooltipContent>
				</Tooltip>
			)
		}
	},
	{
		accessorKey: "contact_mobile",
		header: "Celular",
		cell: ({ row }) => formatPhone(row.original.contact_mobile)
	},
	{
		accessorKey: "created_at",
		header: ({ column }) => {
			return (
				<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
					Data da Solicitação
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
			const status = row.getValue("status") as PartnerStatus
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
		accessorKey: "seller_name",
		header: "Gestor Interno",
		cell: ({ row }) => <div className="text-left">{row.original.seller_name || "-"}</div>,
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id))
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
		cell: ({ row }) => {
			const partner = row.original

			return <PartnerActions partner={partner} />
		}
	}
]
