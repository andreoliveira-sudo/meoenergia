"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Trash2 } from "lucide-react"
import { removeGroupMemberAction } from "@/actions/groups"
import { useOperationFeedback } from "@/components/feedback/operation-feedback"
import { Button } from "@/components/ui/button"

import type { GroupMemberRow } from "./types"

interface MembersTableActionsProps {
	member: GroupMemberRow
}

export const MembersTableActions = ({ member }: MembersTableActionsProps) => {
	const queryClient = useQueryClient()
	const { execute } = useOperationFeedback()

	const mutation = useMutation({
		mutationFn: () =>
			execute({
				action: () => removeGroupMemberAction({ groupId: member.groupId, userId: member.user_id }),
				loadingMessage: "Removendo membro...",
				successMessage: (res) => res.message,
				onSuccess: () => queryClient.invalidateQueries({ queryKey: ["group-members", member.groupId] })
			})
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
