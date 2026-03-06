"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { EquipmentWithRelations } from "@/lib/definitions/equipments"
import { formatDate } from "@/lib/utils"
import { EquipmentsTableActions } from "./equipments-table-actions"

const columns: ColumnDef<EquipmentWithRelations>[] = [
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
		cell: ({ row }) => <div className="text-left font-medium">{row.getValue("name")}</div>
	},
	{
		accessorKey: "equipment_types.name",
		header: ({ column }) => {
			return (
				<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
					Tipo
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			)
		},
		cell: ({ row }) => <div className="text-left">{row.original.equipment_types?.name}</div>
	},
	{
		accessorKey: "equipment_brands.name",
		header: ({ column }) => {
			return (
				<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
					Marca
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			)
		},
		cell: ({ row }) => <div className="text-left">{row.original.equipment_brands?.name || "-"}</div>
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
		cell: ({ row }) => <EquipmentsTableActions equipment={row.original} />
	}
]

export { columns }
