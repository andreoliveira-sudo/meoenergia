"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { CustomerWithRelations } from "@/lib/definitions/customers"
import { formatCnpj } from "@/lib/formatters"
import { getFirstAndLastName } from "@/lib/utils"
import { CustomerTableActions } from "./customer-table-actions"

export const columns: ColumnDef<CustomerWithRelations>[] = [
	{
		accessorKey: "kdi",
		header: ({ column }) => (
			<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
				KDI
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		)
	},
	{
		accessorKey: "company_name",
		header: ({ column }) => (
			<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
				Razão Social
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => <div className="text-left font-medium">{row.getValue("company_name")}</div>
	},
	{
		accessorKey: "cnpj",
		header: "CNPJ",
		cell: ({ row }) => formatCnpj(row.getValue("cnpj"))
	},
	{
		accessorKey: "partner_name",
		header: ({ column }) => (
			<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
				Parceiro
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => {
			const fullName = row.getValue("partner_name") as string
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
		},
		// permite filtro faceted
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id))
		}
	},
	{
		accessorKey: "internal_manager_name",
		header: ({ column }) => (
			<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
				Gestor Interno
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => <div className="text-left">{row.getValue("internal_manager_name") || "-"}</div>,
		// permite filtro faceted
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id))
		}
	},
	{
		accessorKey: "city",
		header: ({ column }) => (
			<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
				Cidade
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => <div className="text-left">{row.getValue("city") || "-"}</div>,
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id))
		}
	},
	{
		accessorKey: "state",
		header: ({ column }) => (
			<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
				Estado
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => <div className="text-left">{row.getValue("state") || "-"}</div>,
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id))
		}
	},
	{
		id: "actions",
		cell: ({ row }) => <CustomerTableActions customer={row.original} />,
		meta: {
			className: "sticky right-0 bg-background shadow-[-5px_0_5px_-5px_#0000001a]"
		}
	}
]
