"use client"

import type { Table } from "@tanstack/react-table"
import { SlidersHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"

interface DataTableViewOptionsProps<TData> {
	table: Table<TData>
	columnNameMap: { [key: string]: string }
}

export const DataTableViewOptions = <TData,>({ table, columnNameMap }: DataTableViewOptionsProps<TData>) => {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					className="ml-auto hidden h-8 lg:flex bg-secondary-foreground/10 hover:bg-secondary-foreground text-secondary-foreground hover:text-secondary"
				>
					<SlidersHorizontal className="mr-2 h-4 w-4" />
					Colunas
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-[150px]">
				<DropdownMenuLabel>Alternar colunas</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{table
					.getAllColumns()
					.filter((column) => typeof column.accessorFn !== "undefined" && column.getCanHide())
					.map((column) => {
						const displayName = columnNameMap[column.id] || column.id.replace(/_/g, " ")
						return (
							<DropdownMenuCheckboxItem
								key={column.id}
								className="capitalize"
								checked={column.getIsVisible()}
								onCheckedChange={(value) => column.toggleVisibility(!!value)}
							>
								{displayName}
							</DropdownMenuCheckboxItem>
						)
					})}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
