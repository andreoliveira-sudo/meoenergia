"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { deleteGroupRuleAction } from "@/actions/groups"
import { Button } from "@/components/ui/button"

import type { GroupRuleRow } from "./types"

interface RulesTableActionsProps {
	rule: GroupRuleRow
}

export const RulesTableActions = ({ rule }: RulesTableActionsProps) => {
	const queryClient = useQueryClient()

	const mutation = useMutation({
		mutationFn: () => deleteGroupRuleAction(rule.id),
		onSuccess: (result) => {
			if (result.success) {
				toast.success(result.message)
				queryClient.invalidateQueries({ queryKey: ["group-rules", rule.groupId] })
			} else {
				toast.error(result.message)
			}
		},
		onError: (error) => {
			const message = error instanceof Error ? error.message : "Erro ao remover regra"
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
			<span className="font-medium">Excluir</span>
		</Button>
	)
}
