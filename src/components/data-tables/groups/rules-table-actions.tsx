"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Trash2 } from "lucide-react"
import { deleteGroupRuleAction } from "@/actions/groups"
import { useOperationFeedback } from "@/components/feedback/operation-feedback"
import { Button } from "@/components/ui/button"

import type { GroupRuleRow } from "./types"

interface RulesTableActionsProps {
	rule: GroupRuleRow
}

export const RulesTableActions = ({ rule }: RulesTableActionsProps) => {
	const queryClient = useQueryClient()
	const { execute } = useOperationFeedback()

	const mutation = useMutation({
		mutationFn: () =>
			execute({
				action: () => deleteGroupRuleAction(rule.id),
				loadingMessage: "Excluindo regra...",
				successMessage: (res) => res.message,
				onSuccess: () => queryClient.invalidateQueries({ queryKey: ["group-rules", rule.groupId] })
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
			<span className="font-medium">Excluir</span>
		</Button>
	)
}
