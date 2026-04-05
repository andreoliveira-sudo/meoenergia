"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { OrderStatus, OrderWorkflowStatus, OrderWithRelations } from "@/lib/definitions/orders"
import { formatCnpj, formatCpf } from "@/lib/formatters"
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
	analysis_approved: "Aprovado",
	analysis_rejected: "Reprovado",
	documents_pending: "Ag. Documentos",
	docs_analysis: "Análise Docs",
	sending_distributor_invoice: "Envio NF Distribuidora",
	payment_distributor: "Pgto. Distribuidora",
	access_opinion: "Parecer de Acesso",
	initial_payment_integrator: "Pagt inicial Integrador",
	final_payment_integrator: "Pagt Final Integrador",
	finished: "Finalizado",
	canceled: "Cancelado"
}

const statusVariant: Record<OrderStatus, "default" | "secondary" | "destructive" | "outline"> = {
	analysis_pending: "secondary",
	analysis_approved: "outline",
	analysis_rejected: "outline",
	documents_pending: "secondary",
	docs_analysis: "outline",
	sending_distributor_invoice: "default",
	payment_distributor: "default",
	access_opinion: "default",
	initial_payment_integrator: "default",
	final_payment_integrator: "default",
	finished: "default",
	canceled: "destructive"
}

const statusColor: Record<OrderStatus, string> = {
	analysis_pending: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
	analysis_approved: "bg-blue-500/20 text-blue-700 border-blue-500/30",
	analysis_rejected: "bg-red-500/20 text-red-700 border-red-500/30",
	documents_pending: "bg-yellow-600/80 text-white",
	docs_analysis: "bg-purple-600/20 text-purple-800 border-purple-500/30",
	sending_distributor_invoice: "bg-green-500/20 text-green-700 border-green-500/30",
	payment_distributor: "bg-green-600/20 text-green-700 border-green-500/30",
	access_opinion: "bg-blue-400/25 text-blue-75 border-blue-45",
	initial_payment_integrator: "bg-blue-45 text-blue-75 border-blue-45",
	final_payment_integrator: "bg-blue-45 text-blue-75 border-blue-45",
	finished: "bg-green-65 text-white border-green-65",
	canceled: "bg-red-500 hover:bg-red-600"
}

// ─── Status do Pedido (workflow) ───
const orderStatusTranslations: Record<string, string> = {
	in_review: "Em revisão",
	rejected: "Reprovado",
	documents_pending: "Ag. Documentos",
	docs_analysis: "Analisando Docs",
	documents_issue: "Pendência documentos",
	awaiting_signature: "Aguardando assinatura",
	awaiting_distributor_docs: "Aguardando docs distribuidor",
	analyzing_distributor_docs: "Analisando docs distribuidor",
	distributor_docs_issue: "Pendência docs distribuidor",
	equipment_separation: "Equipamentos em Separação",
	equipment_transit: "Equipamentos em Trânsito",
	equipment_delivered: "Equipamento entregue",
	awaiting_integrator_docs: "Aguardando docs integrador",
	analyzing_integrator_docs: "Analisando docs integrador",
	integrator_docs_issue: "Pendência docs integrador",
	finished: "Finalizado",
	canceled: "Cancelado",
}

const orderStatusColor: Record<string, string> = {
	in_review: "bg-slate-500/20 text-slate-700 border-slate-500/30",
	rejected: "bg-red-500/20 text-red-700 border-red-500/30",
	documents_pending: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
	docs_analysis: "bg-purple-500/20 text-purple-700 border-purple-500/30",
	documents_issue: "bg-orange-500/20 text-orange-700 border-orange-500/30",
	awaiting_signature: "bg-indigo-500/20 text-indigo-700 border-indigo-500/30",
	awaiting_distributor_docs: "bg-amber-500/20 text-amber-700 border-amber-500/30",
	analyzing_distributor_docs: "bg-purple-500/20 text-purple-700 border-purple-500/30",
	distributor_docs_issue: "bg-orange-500/20 text-orange-700 border-orange-500/30",
	equipment_separation: "bg-cyan-500/20 text-cyan-700 border-cyan-500/30",
	equipment_transit: "bg-blue-500/20 text-blue-700 border-blue-500/30",
	equipment_delivered: "bg-green-500/20 text-green-700 border-green-500/30",
	awaiting_integrator_docs: "bg-amber-500/20 text-amber-700 border-amber-500/30",
	analyzing_integrator_docs: "bg-purple-500/20 text-purple-700 border-purple-500/30",
	integrator_docs_issue: "bg-orange-500/20 text-orange-700 border-orange-500/30",
	finished: "bg-green-600/20 text-green-700 border-green-600/30",
	canceled: "bg-red-500/20 text-red-700 border-red-500/30",
}

export function createOrderColumns(filterType?: "pf" | "pj"): ColumnDef<OrderWithRelations>[] {
	const isPF = filterType === "pf"

	return [
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
			header: isPF ? "CPF" : "CNPJ",
			cell: ({ row }) => {
				const value = row.getValue("cnpj") as string
				if (!value) return "-"
				if (row.original.customer_type === "pf") {
					return formatCpf(value)
				}
				return formatCnpj(value)
			}
		},
		{
			accessorKey: "customer_name",
			header: "Cliente",
			cell: ({ row }) => {
				const name = row.original.customer_name || "-"
				return <div className="text-left font-medium">{name !== "-" ? name.toUpperCase() : name}</div>
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
			header: "Pot\u00eancia (kWp)",
			cell: ({ row }) => `${row.original.system_power} kWp`
		},
		{
			accessorKey: "total_value",
			header: "Valor",
			cell: ({ row }) => formatCurrency(row.original.total_value)
		},
		{
			accessorKey: "status",
			header: "St. Crédito",
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
			accessorKey: "order_status",
			header: "St. Pedido",
			cell: ({ row }) => {
				const orderStatus = row.getValue("order_status") as string | null
				if (!orderStatus) return <span className="text-muted-foreground text-xs">-</span>
				return (
					<Badge variant="outline" className={cn("text-[10px] whitespace-nowrap", orderStatusColor[orderStatus] || "")}>
						{orderStatusTranslations[orderStatus] || orderStatus}
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
}

// Mantém export padrão para compatibilidade
export const columns = createOrderColumns()
