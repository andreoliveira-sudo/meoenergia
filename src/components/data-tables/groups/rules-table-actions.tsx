"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Trash2 } from "lucide-react"
import { useState } from "react"
import { deleteGroupRuleAction } from "@/actions/groups"
import { useOperationFeedback } from "@/components/feedback/operation-feedback"
import { Button } from "@/components/ui/button"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"

import type { GroupRuleRow } from "./types"

interface RulesTableActionsProps {
	rule: GroupRuleRow
}

export const RulesTableActions = ({ rule }: RulesTableActionsProps) => {
	const queryClient = useQueryClient()
	const { execute } = useOperationFeedback()
	const [deleteOpen, setDeleteOpen] = useState(false)

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
		<>
			<Button
				variant="ghost"
				size="sm"
				onClick={() => setDeleteOpen(true)}
				disabled={mutation.isPending}
				className="justify-start gap-2 text-destructive hover:text-destructive"
			>
				{mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
				<span className="font-medium">Excluir</span>
			</Button>
			<ConfirmDeleteDialog
				open={deleteOpen}
				onOpenChange={setDeleteOpen}
				onConfirm={() => mutation.mutate()}
				title="Excluir Regra"
				description="Tem certeza que deseja excluir esta regra?"
				loading={mutation.isPending}
			/>
		</>
	)
}
