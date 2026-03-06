"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { SimulationStatus, SimulationWithRelations } from "@/lib/definitions/simulations"
import { formatCnpj } from "@/lib/formatters"
import { cn, formatDate, getFirstAndLastName } from "@/lib/utils"
import { SimulationsTableActions } from "./simulations-table-actions"

const formatCurrency = (value: number | null | undefined): string => {
	if (value === null || value === undefined) return "N/A"

	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	}).format(value)
}

const statusTranslations: Record<SimulationStatus, string> = {
	initial_contact: "Contato Inicial",
	under_review: "Em análise Cliente",
	in_negotiation: "Em Negociação",
	won: "Ganho",
	lost: "Perdido"
}

const statusVariant: Record<SimulationStatus, "default" | "secondary" | "destructive" | "outline"> = {
	initial_contact: "secondary",
	under_review: "outline",
	in_negotiation: "default",
	won: "default", // Should be a success variant, using default for now
	lost: "destructive"
}

const statusColor: Record<SimulationStatus, string> = {
	initial_contact: "",
	under_review: "",
	in_negotiation: "",
	won: "bg-green-500 hover:bg-green-600 border-green-600 text-white",
	lost: ""
}

export const columns: ColumnDef<SimulationWithRelations>[] = [
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
		accessorKey: "cnpj",
		header: "CNPJ",
		cell: ({ row }) => formatCnpj(row.getValue("cnpj"))
	},
	{
		accessorKey: "company_name",
		header: "Razão Social"
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
		accessorKey: "partner_name",
		header: "Parceiro",
		cell: ({ row }) => {
			const fullName = row.getValue("partner_name") as string
			return (
				<Tooltip>
					<TooltipTrigger asChild>
						<div className="cursor-pointer">{getFirstAndLastName(fullName)}</div>
					</TooltipTrigger>
					<TooltipContent>
						<p>{fullName}</p>
					</TooltipContent>
				</Tooltip>
			)
		},
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id))
		}
	},
	{
		accessorKey: "internal_manager",
		header: "Gestor Interno",
		cell: ({ row }) => row.original.internal_manager || "-",
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id))
		}
	},
	{
		accessorKey: "system_power",
		header: "Potência (kWp)",
		cell: ({ row }) => `${row.original.system_power} kWp`
	},
	{
		accessorKey: "total_value",
		header: "Valor",
		cell: ({ row }) => formatCurrency(row.original.total_value)
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => {
			const status = row.getValue("status") as SimulationStatus
			return (
				<Badge variant={statusVariant[status]} className={cn(statusColor[status])}>
					{statusTranslations[status]}
				</Badge>
			)
		},
		// NOVO: permite filtro faceted (DataTableFacetedFilter)
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id))
		}
	},
	{
		accessorKey: "created_by_user",
		header: "Criado por",
		cell: ({ row }) => row.original.created_by_user || "-",
		// NOVO: permite filtro faceted (DataTableFacetedFilter)
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id))
		}
	},
	{
		accessorKey: "created_at",
		header: ({ column }) => (
			<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
				Data
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => formatDate(row.getValue("created_at")),
		// NOVO: filtro por intervalo de datas
		filterFn: (row, id, value) => {
			const raw = row.getValue(id) as string | Date
			const rowDate = raw instanceof Date ? raw : new Date(raw)

			const { from, to } = (value ?? {}) as { from?: string; to?: string }

			if (!from && !to) return true

			if (from) {
				const fromDate = new Date(from)
				// se a data da linha for antes do início, exclui
				if (rowDate < fromDate) return false
			}

			if (to) {
				const toDate = new Date(to)
				// se a data da linha for depois do fim, exclui
				if (rowDate > toDate) return false
			}

			return true
		}
	},
	{
		id: "actions",
		cell: ({ row }) => <SimulationsTableActions simulation={row.original} />
	}
]
