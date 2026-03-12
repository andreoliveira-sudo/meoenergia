"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ApiLog } from "@/actions/developer/get-api-logs"
import { format } from "date-fns"

function formatTimestamp(dateString: string): string {
	if (!dateString) return ""
	const date = new Date(dateString)
	return format(date, "dd/MM/yyyy HH:mm:ss")
}

export const columns: ColumnDef<ApiLog>[] = [
	{
		accessorKey: "created_at",
		header: ({ column }) => (
			<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
				Data/Hora
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => {
			const date = row.getValue("created_at") as string
			return <span className="whitespace-nowrap font-mono text-xs">{formatTimestamp(date)}</span>
		}
	},
	{
		accessorKey: "method",
		header: "Método",
		cell: ({ row }) => {
			const method = row.getValue("method") as string
			const variant = method === "GET" ? "outline" : method === "POST" ? "default" : "secondary"
			return <Badge variant={variant}>{method}</Badge>
		},
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id))
		}
	},
	{
		accessorKey: "path",
		header: "Caminho",
		cell: ({ row }) => {
			const path = row.getValue("path") as string
			return (
				<span className="font-mono text-xs max-w-[250px] truncate block" title={path}>
					{path}
				</span>
			)
		}
	},
	{
		accessorKey: "status_code",
		header: ({ column }) => (
			<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
				Status
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => {
			const status = row.getValue("status_code") as number
			const isSuccess = status >= 200 && status < 300
			const isClientError = status >= 400 && status < 500
			const isServerError = status >= 500

			return (
				<Badge
					variant={isServerError ? "destructive" : "outline"}
					className={
						isSuccess
							? "border-green-500 text-green-600"
							: isClientError
								? "border-yellow-500 text-yellow-600"
								: ""
					}
				>
					{status}
				</Badge>
			)
		},
		filterFn: (row, id, value) => {
			const status = row.getValue(id) as number
			if (value.includes("success")) {
				if (status >= 200 && status < 300) return true
			}
			if (value.includes("client_error")) {
				if (status >= 400 && status < 500) return true
			}
			if (value.includes("server_error")) {
				if (status >= 500) return true
			}
			return false
		}
	},
	{
		accessorKey: "duration_ms",
		header: ({ column }) => (
			<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
				Duração
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => {
			const duration = row.getValue("duration_ms") as number | null
			if (duration === null) return <span className="text-muted-foreground text-xs">-</span>
			return <span className="font-mono text-xs">{duration}ms</span>
		}
	},
	{
		accessorKey: "api_key_name",
		header: "Chave API",
		cell: ({ row }) => {
			const name = row.original.api_key_name
			const prefix = row.original.api_key_prefix
			if (!name) return <span className="text-muted-foreground text-xs">-</span>
			return (
				<div className="flex flex-col">
					<span className="text-sm">{name}</span>
					{prefix && (
						<code className="text-xs text-muted-foreground">{prefix}...</code>
					)}
				</div>
			)
		},
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id))
		}
	}
]
