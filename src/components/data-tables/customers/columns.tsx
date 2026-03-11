"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { CustomerWithRelations } from "@/lib/definitions/customers"
import { formatCnpj, formatCpf } from "@/lib/formatters"
import { formatDate, getFirstAndLastName } from "@/lib/utils"
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
		accessorKey: "type",
		header: "Tipo",
		cell: ({ row }) => {
			const type = row.getValue("type") as string
			return (
				<span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${type === "pj" ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"}`}>
					{type === "pj" ? "PJ" : "PF"}
				</span>
			)
		},
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id))
		}
	},
	{
		accessorKey: "company_name",
		header: ({ column }) => (
			<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
				Razão Social/Nome
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => {
			const name = (row.getValue("company_name") as string) || ""
			return <div className="text-left font-medium">{name.toUpperCase()}</div>
		}
	},
	{
		accessorKey: "cnpj",
		header: "CNPJ/CPF",
		cell: ({ row }) => {
			const type = row.original.type
			const value = row.getValue("cnpj") as string
			if (!value) return "-"
			if (type === "pf") return formatCpf(value)
			return formatCnpj(value)
		}
	},
	{
		accessorKey: "created_at",
		header: ({ column }) => (
			<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
				Data de Cadastro
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => {
			const value = row.getValue("created_at") as string | null
			if (!value) return "-"
			return formatDate(value)
		}
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
