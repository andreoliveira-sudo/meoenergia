"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { OrderStatus, OrderWithRelations } from "@/lib/definitions/orders"
import { formatCnpj } from "@/lib/formatters"
import { cn, formatDate, getFirstAndLastName } from "@/lib/utils"
import { OrdersTableActions } from "./orders-table-actions"

const formatCurrency = (value: number | null | undefined): string => {
	if (value === null || value === undefined) return "N/A"
	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL"
	}).format(value)
}

const statusTranslations: Record<OrderStatus, string> = {
	analysis_pending: "Ag. Análise",
	pre_analysis: "Análise Prévia",
	confirmation_pending: "Em Confirmação",
	credit_analysis: "Análise de Crédito",
	documents_pending: "Ag. Documentos",
	docs_analysis: "Análise Docs",
	final_analysis: "Análise Final",
	approved: "Aprovado",
	rejected: "Reprovado",
	contract_signing: "Assinatura Contrato",
	completed: "Finalizado",
	canceled: "Cancelado",
	pre_approved: "Pré-Aprovado",
	pre_approved_orange: "Pré-Aprovado",
	frozen: "Congelado"
}

const statusVariant: Record<OrderStatus, "default" | "secondary" | "destructive" | "outline"> = {
	analysis_pending: "secondary",
	pre_analysis: "outline",
	confirmation_pending: "outline",
	credit_analysis: "default",
	documents_pending: "secondary",
	docs_analysis: "outline",
	final_analysis: "default",
	approved: "default",
	rejected: "destructive",
	contract_signing: "default",
	completed: "default",
	canceled: "destructive",
	pre_approved: "default",
	pre_approved_orange: "default",
	frozen: "outline"
}

const statusColor: Record<OrderStatus, string> = {
	analysis_pending: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
	pre_analysis: "bg-blue-500/20 text-blue-700 border-blue-500/30",
	confirmation_pending: "bg-sky-500/20 text-purple-700 border-purple-500/30",
	credit_analysis: "bg-blue-600/80 text-white",
	documents_pending: "bg-yellow-600/80 text-white",
	docs_analysis: "bg-purple-600/20 text-purple-800 border-purple-500/30",
	final_analysis: "bg-blue-700/80 text-white",
	approved: "bg-green-500 hover:bg-green-600 border-green-600 text-white",
	rejected: "bg-red-500 hover:bg-red-600",
	contract_signing: "bg-teal-500 text-white",
	completed: "bg-green-700 hover:bg-green-800 text-white",
	canceled: "bg-gray-500 hover:bg-gray-600",
	pre_approved: "bg-green-500/20 text-green-700 border-green-500/30",
	pre_approved_orange: "bg-orange-500/20 text-orange-700 border-orange-500/30",
	frozen: "bg-blue-700/80 text-white"
}

export const columns: ColumnDef<OrderWithRelations>[] = [
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
		accessorKey: "customer_name",
		header: "Cliente",
		cell: ({ row }) => row.original.customer_name || "-"
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
			const status = row.getValue("status") as OrderStatus
			return (
				<Badge variant={statusVariant[status]} className={cn(statusColor[status])}>
					{statusTranslations[status]}
				</Badge>
			)
		},
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id))
		}
	},
	{
		accessorKey: "created_by_user",
		header: "Criado por",
		cell: ({ row }) => row.original.created_by_user || "-",
		// permite filtro faceted (DataTableFacetedFilter)
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
		// filtro de intervalo de data: value = { from?: string; to?: string }
		filterFn: (row, id, value) => {
			const raw = row.getValue(id) as string | Date
			const rowDate = raw instanceof Date ? raw : new Date(raw)

			const { from, to } = (value ?? {}) as { from?: string; to?: string }

			if (!from && !to) return true

			if (from) {
				const fromDate = new Date(from)
				if (rowDate < fromDate) return false
			}

			if (to) {
				const toDate = new Date(to)
				// opcional: normalizar pro fim do dia, se quiser incluir o próprio dia
				// toDate.setHours(23, 59, 59, 999)
				if (rowDate > toDate) return false
			}

			return true
		}
	},
	{
		id: "actions",
		cell: ({ row }) => <OrdersTableActions order={row.original} />
	}
]
