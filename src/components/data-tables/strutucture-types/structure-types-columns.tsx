"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { StructureType } from "@/lib/definitions/equipments"
import { formatDate } from "@/lib/utils"
import { StructureTypesTableActions } from "./structure-types-table-actions"

const columns: ColumnDef<StructureType>[] = [
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
		cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>
	},
	{
		accessorKey: "created_at",
		header: ({ column }) => {
			return (
				<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
					Data de Criação
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			)
		},
		cell: ({ row }) => {
			return <div className="text-center">{formatDate(row.getValue("created_at"))}</div>
		}
	},
	{
		id: "actions",
		cell: ({ row }) => <StructureTypesTableActions structureType={row.original} />
	}
]

export { columns }
