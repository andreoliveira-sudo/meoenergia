"use client"

import type { ColumnDef } from "@tanstack/react-table"

import { MembersTableActions } from "./members-table-actions"
import type { GroupMemberRow } from "./types"

export const columns: ColumnDef<GroupMemberRow>[] = [
	{
		accessorKey: "name",
		header: "Nome",
		cell: ({ row }) => <span className="font-medium">{row.getValue("name") as string}</span>,
		filterFn: (row, id, value) => {
			const query = String(value ?? "").toLowerCase()
			if (!query) {
				return true
			}
			const name = (row.getValue(id) as string)?.toLowerCase() ?? ""
			const email = row.original.email?.toLowerCase() ?? ""
			return name.includes(query) || email.includes(query)
		}
	},
	{
		accessorKey: "email",
		header: "Email",
		cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.getValue("email") as string}</span>
	},
	{
		id: "actions",
		header: "Acoes",
		cell: ({ row }) => <MembersTableActions member={row.original} />
	}
]
