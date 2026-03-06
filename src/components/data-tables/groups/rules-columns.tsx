"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"

import { RulesTableActions } from "./rules-table-actions"
import type { GroupRuleRow } from "./types"

const ruleTypeLabelMap: Record<GroupRuleRow["rule_type"], string> = {
	include: "Incluir",
	exclude: "Excluir"
}

export const rulesColumns: ColumnDef<GroupRuleRow>[] = [
	{
		accessorKey: "rule_type",
		header: ({ column }) => (
			<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
				Tipo
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => {
			const type = row.getValue("rule_type") as GroupRuleRow["rule_type"]
			return <span>{ruleTypeLabelMap[type] ?? type}</span>
		},
		filterFn: (row, id, value) => {
			return Array.isArray(value) ? value.includes(row.getValue(id)) : true
		}
	},
	{
		accessorKey: "partnerName",
		header: ({ column }) => (
			<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
				Parceiro
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.getValue("partnerName") as string}</span>,
		filterFn: (row, id, value) => {
			const search = String(value ?? "").toLowerCase()
			if (!search) {
				return true
			}
			const target = (row.getValue(id) as string)?.toLowerCase() ?? ""
			return target.includes(search)
		}
	},
	{
		accessorKey: "created_at",
		header: ({ column }) => (
			<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
				Criado em
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => {
			const createdAt = row.getValue("created_at") as string
			return <span>{formatDate(createdAt)}</span>
		}
	},
	{
		id: "actions",
		header: "Acoes",
		cell: ({ row }) => <RulesTableActions rule={row.original} />
	}
]
