"use client"

import { useQueryClient } from "@tanstack/react-query"
import { CheckCircle, Loader2, Pencil, ToggleLeft, ToggleRight, Trash2, XCircle } from "lucide-react"
import { useState, useTransition } from "react"
import { approveSeller, deleteSeller, rejectSeller, setSellerActiveStatus } from "@/actions/sellers"
import { useOperationFeedback } from "@/components/feedback/operation-feedback"
import { EditSellerDialog } from "@/components/dialogs/edit-seller-dialog"
import { Button } from "@/components/ui/button"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { Seller } from "@/lib/definitions/sellers"

const SellerActions = ({ seller }: { seller: Seller }) => {
	const queryClient = useQueryClient()
	const [isPending, startTransition] = useTransition()
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
	const [deleteOpen, setDeleteOpen] = useState(false)
	const [isDeletePending, startDeleteTransition] = useTransition()
	const { execute } = useOperationFeedback()

	function handleApprovalAction(action: "approve" | "reject") {
		startTransition(() => {
			execute({
				action: () => (action === "approve" ? approveSeller(seller.id) : rejectSeller(seller.id)),
				loadingMessage: action === "approve" ? "Aprovando vendedor..." : "Rejeitando vendedor...",
				successMessage: (res) => res.message,
				onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ["sellers"] })
				queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
			}
			})
		})
	}

	function handleToggleActive(isActive: boolean) {
		startTransition(() => {
			execute({
				action: () => setSellerActiveStatus({ sellerId: seller.id, isActive }),
				loadingMessage: isActive ? "Reativando vendedor..." : "Inativando vendedor...",
				successMessage: (res) => res.message,
				onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sellers"] })
			})
		})
	}

	function handleDelete() {
		startDeleteTransition(() => {
			execute({
				action: () => deleteSeller({ sellerId: seller.id, userId: seller.user_id }),
				loadingMessage: "Deletando vendedor...",
				successMessage: (res) => res.message,
				onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sellers"] })
			})
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
							<Button className="delete-button" variant="ghost" size="icon" onClick={() => setDeleteOpen(true)} disabled={isDeletePending}>
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
			<ConfirmDeleteDialog
				open={deleteOpen}
				onOpenChange={setDeleteOpen}
				onConfirm={handleDelete}
				title="Excluir Vendedor"
				description="Tem certeza que deseja excluir este vendedor?"
				details={[
					{ label: "Nome", value: seller.name },
					{ label: "Email", value: seller.email },
				]}
				loading={isDeletePending}
			/>
		</>
	)
}

export { SellerActions }
