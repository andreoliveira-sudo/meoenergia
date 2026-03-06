"use client"

import { useQueryClient } from "@tanstack/react-query"
import { CheckCircle, Loader2, Pencil, ToggleLeft, ToggleRight, Trash2, XCircle } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { approveSeller, deleteSeller, rejectSeller, setSellerActiveStatus } from "@/actions/sellers"
import { EditSellerDialog } from "@/components/dialogs/edit-seller-dialog"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { Seller } from "@/lib/definitions/sellers"

const SellerActions = ({ seller }: { seller: Seller }) => {
	const queryClient = useQueryClient()
	const [isPending, startTransition] = useTransition()
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
	const [isDeletePending, startDeleteTransition] = useTransition()

	function handleApprovalAction(action: "approve" | "reject") {
		startTransition(async () => {
			const actionPromise = action === "approve" ? approveSeller(seller.id) : rejectSeller(seller.id)
			const result = await actionPromise

			if (result.success) {
				toast.success(result.message)
				queryClient.invalidateQueries({ queryKey: ["sellers"] })
			} else {
				toast.error(result.message)
			}
		})
	}

	function handleToggleActive(isActive: boolean) {
		startTransition(async () => {
			const result = await setSellerActiveStatus({ sellerId: seller.id, isActive })
			if (result.success) {
				toast.success(result.message)
				queryClient.invalidateQueries({ queryKey: ["sellers"] })
			} else {
				toast.error(result.message)
			}
		})
	}

	function handleDelete() {
		startDeleteTransition(async () => {
			try {
				const result = await deleteSeller({ sellerId: seller.id, userId: seller.user_id })

				if (result.success) {
					queryClient.invalidateQueries({ queryKey: ["sellers"] })
					toast.success(result.message)
				} else {
					toast.error(result.message)
				}
			} catch (err) {
				toast.error(err instanceof Error ? err.message : "Erro desconhecido")
			}
		})
	}

	return (
		<>
			<div className="flex items-center justify-center">
				<div className="contents alternative-buttons space-x-1">
					<Tooltip>
						<TooltipTrigger asChild>
							<Button variant="ghost" size="icon" onClick={() => setIsEditDialogOpen(true)}>
								<Pencil className="h-4 w-4" />
								<span className="sr-only">Editar Vendedor</span>
							</Button>
						</TooltipTrigger>
						<TooltipContent>Editar Vendedor</TooltipContent>
					</Tooltip>

					{seller.status === "approved" &&
						(seller.is_active ? (
							<Tooltip>
								<TooltipTrigger asChild>
									<Button variant="ghost" size="icon" onClick={() => handleToggleActive(false)} disabled={isPending}>
										{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ToggleLeft className="h-4 w-4" />}
										<span className="sr-only">Inativar</span>
									</Button>
								</TooltipTrigger>
								<TooltipContent>Inativar</TooltipContent>
							</Tooltip>
						) : (
							<Tooltip>
								<TooltipTrigger asChild>
									<Button variant="ghost" size="icon" onClick={() => handleToggleActive(true)} disabled={isPending}>
										{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ToggleRight className="h-4 w-4" />}
										<span className="sr-only">Reativar</span>
									</Button>
								</TooltipTrigger>
								<TooltipContent>Reativar</TooltipContent>
							</Tooltip>
						))}

					<Tooltip>
						<TooltipTrigger asChild>
							<Button className="delete-button" variant="ghost" size="icon" onClick={handleDelete} disabled={isDeletePending}>
								{isDeletePending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
								<span className="sr-only">Deletar</span>
							</Button>
						</TooltipTrigger>
						<TooltipContent className="tooltip-content bg-destructive fill-destructive text-white">Deletar Vendedor</TooltipContent>
					</Tooltip>
				</div>

				{seller.status === "pending" && (
					<>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									className="ml-2 p-0 rounded-full hover:bg-green-500 group"
									variant="ghost"
									size="icon"
									onClick={() => handleApprovalAction("approve")}
									disabled={isPending}
								>
									{isPending ? (
										<Loader2 className="size-6 animate-spin text-green-500 group-hover:text-white" />
									) : (
										<CheckCircle className="size-6 text-green-500 group-hover:text-white" />
									)}
									<span className="sr-only">Aprovar</span>
								</Button>
							</TooltipTrigger>
							<TooltipContent>Aprovar</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									className="ml-1 rounded-full hover:bg-destructive group"
									variant="ghost"
									size="icon"
									onClick={() => handleApprovalAction("reject")}
									disabled={isPending}
								>
									{isPending ? (
										<Loader2 className="size-6 animate-spin text-destructive group-hover:text-white" />
									) : (
										<XCircle className="size-6 text-destructive group-hover:text-white" />
									)}
									<span className="sr-only">Rejeitar</span>
								</Button>
							</TooltipTrigger>
							<TooltipContent>Rejeitar</TooltipContent>
						</Tooltip>
					</>
				)}
			</div>

			<EditSellerDialog seller={seller} open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} />
		</>
	)
}

export { SellerActions }
