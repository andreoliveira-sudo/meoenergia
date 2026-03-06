"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { removeGroupMemberAction } from "@/actions/groups"
import { Button } from "@/components/ui/button"

import type { GroupMemberRow } from "./types"

interface MembersTableActionsProps {
	member: GroupMemberRow
}

export const MembersTableActions = ({ member }: MembersTableActionsProps) => {
	const queryClient = useQueryClient()

	const mutation = useMutation({
		mutationFn: () => removeGroupMemberAction({ groupId: member.groupId, userId: member.user_id }),
		onSuccess: (result) => {
			if (result.success) {
				toast.success(result.message)
				queryClient.invalidateQueries({ queryKey: ["group-members", member.groupId] })
			} else {
				toast.error(result.message)
			}
		},
		onError: (error) => {
			const message = error instanceof Error ? error.message : "Erro ao remover membro"
			toast.error(message)
		}
	})

	return (
		<Button
			variant="ghost"
			size="sm"
			onClick={() => mutation.mutate()}
			disabled={mutation.isPending}
			className="justify-start gap-2 text-destructive hover:text-destructive"
		>
			{mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
			<span className="font-medium">Remover</span>
		</Button>
	)
}
