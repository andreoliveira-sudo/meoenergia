"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"

import { BrandsTableActions } from "@/components/data-tables/brands/brands-table-actions"
import { Button } from "@/components/ui/button"
import type { EquipmentBrand } from "@/lib/definitions/equipments"
import { formatDate } from "@/lib/utils"

const columns: ColumnDef<EquipmentBrand>[] = [
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
		cell: ({ row }) => <BrandsTableActions brand={row.original} />
	}
]

export { columns }
