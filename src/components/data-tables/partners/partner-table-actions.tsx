"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { CheckCircle, Eye, Loader2, MoreHorizontal, Pencil, ToggleLeft, ToggleRight, Trash2, XCircle } from "lucide-react"
import { useState, useTransition } from "react"
import { approvePartner, deletePartner, rejectPartner, setPartnerActiveStatus } from "@/actions/partners"
import { ApprovePartnerDialog } from "@/components/dialogs/approve-partner-dialog"
import { EditPartnerDialog } from "@/components/dialogs/edit-partner-dialog"
import { useOperationFeedback } from "@/components/feedback/operation-feedback"
import { Button } from "@/components/ui/button"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Partner } from "@/lib/definitions/partners"
import { formatCep, formatCnpj, formatPhone } from "@/lib/formatters"
import { hasPermission } from "@/actions/auth"

const PartnerActions = ({ partner }: { partner: Partner }) => {
	const queryClient = useQueryClient()
	const [isPending, startTransition] = useTransition()
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
	const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)
	const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
	const [deleteOpen, setDeleteOpen] = useState(false)
	const [isDeletePending, startDeleteTransition] = useTransition()
	const { execute } = useOperationFeedback()

	const { data: canManage } = useQuery({
		queryKey: ["permission", "partners:manage"],
		queryFn: () => hasPermission("partners:manage")
	})

	function handleReject() {
		startTransition(() => {
			execute({
				action: () => rejectPartner(partner.id),
				loadingMessage: "Rejeitando parceiro...",
				successMessage: (res) => res.message,
				onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ["partners"] })
				queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
			}
			})
		})
	}

	function handleToggleActive(isActive: boolean) {
		startTransition(() => {
			execute({
				action: () => setPartnerActiveStatus({ partnerId: partner.id, isActive }),
				loadingMessage: isActive ? "Reativando parceiro..." : "Inativando parceiro...",
				successMessage: (res) => res.message,
				onSuccess: () => queryClient.invalidateQueries({ queryKey: ["partners"] })
			})
		})
	}

	function handleDelete() {
		startDeleteTransition(() => {
			execute({
				action: () => deletePartner({ partnerId: partner.id, userId: partner.user_id }),
				loadingMessage: "Deletando parceiro...",
				successMessage: (res) => res.message,
				onSuccess: () => queryClient.invalidateQueries({ queryKey: ["partners"] })
			})
		})
	}

	if (!canManage) {
		return null
	}

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" className="h-8 w-8 p-0">
						<span className="sr-only">Abrir menu</span>
						<MoreHorizontal className="h-4 w-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuLabel>Ações</DropdownMenuLabel>
					<DropdownMenuItem onClick={() => navigator.clipboard.writeText(partner.id)}>
						Copiar ID
					</DropdownMenuItem>
					<DropdownMenuSeparator />

					<DropdownMenuItem onSelect={() => setIsEditDialogOpen(true)}>
						<Pencil className="mr-2 h-4 w-4" /> Editar
					</DropdownMenuItem>

					<DropdownMenuItem onSelect={() => setIsViewDialogOpen(true)}>
						<Eye className="mr-2 h-4 w-4" /> Ver Detalhes
					</DropdownMenuItem>

					{partner.status === "pending" && (
						<>
							<DropdownMenuSeparator />
							<DropdownMenuItem onSelect={() => setIsApproveDialogOpen(true)} className="text-green-600 focus:text-green-600">
								<CheckCircle className="mr-2 h-4 w-4" /> Aprovar
							</DropdownMenuItem>
							<DropdownMenuItem onSelect={handleReject} className="text-destructive focus:text-destructive">
								<XCircle className="mr-2 h-4 w-4" /> Rejeitar
							</DropdownMenuItem>
						</>
					)}

					{partner.status === "approved" && (
						<DropdownMenuItem onSelect={() => handleToggleActive(!partner.is_active)}>
							{partner.is_active ? <ToggleLeft className="mr-2 h-4 w-4" /> : <ToggleRight className="mr-2 h-4 w-4" />}
							{partner.is_active ? "Inativar" : "Reativar"}
						</DropdownMenuItem>
					)}

					<DropdownMenuSeparator />
					<DropdownMenuItem onSelect={() => setDeleteOpen(true)} className="text-destructive focus:text-destructive">
						<Trash2 className="mr-2 h-4 w-4" /> Deletar
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<ConfirmDeleteDialog
				open={deleteOpen}
				onOpenChange={setDeleteOpen}
				onConfirm={handleDelete}
				title="Excluir Parceiro"
				description="Tem certeza que deseja excluir este parceiro?"
				details={[
					{ label: "Razão Social", value: partner.legal_business_name },
					{ label: "CNPJ", value: partner.cnpj },
					{ label: "Contato", value: partner.contact_name },
				]}
				loading={isDeletePending}
			/>
			<EditPartnerDialog partner={partner} open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} />
			<ApprovePartnerDialog partner={partner} open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen} />

			<Popover open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
				<PopoverContent className="w-96">
					<div className="grid gap-4 text-left">
						<div className="space-y-2">
							<h4 className="font-medium leading-none">{partner.legal_business_name}</h4>
							<p className="text-sm text-muted-foreground">Detalhes completos do parceiro.</p>
						</div>
						<Separator />
						<div className="grid gap-2 text-sm">
							<h5 className="font-semibold">Dados da Empresa</h5>
							<div className="grid grid-cols-[100px_1fr] items-center">
								<span className="font-medium text-muted-foreground">CNPJ</span>
								<span>{formatCnpj(partner.cnpj)}</span>
							</div>
							<Separator />
							<h5 className="font-semibold pt-2">Contato</h5>
							<div className="grid grid-cols-[100px_1fr] items-center">
								<span className="font-medium text-muted-foreground">Responsável</span>
								<span>{partner.contact_name}</span>
							</div>
							<div className="grid grid-cols-[100px_1fr] items-center">
								<span className="font-medium text-muted-foreground">Celular</span>
								<span>{formatPhone(partner.contact_mobile)}</span>
							</div>
							<div className="grid grid-cols-[100px_1fr] items-center">
								<span className="font-medium text-muted-foreground">Email</span>
								<span>{partner.contact_email}</span>
							</div>
							<Separator />
							<h5 className="font-semibold pt-2">Endereço</h5>
							<div className="grid grid-cols-[100px_1fr] items-center">
								<span className="font-medium text-muted-foreground">CEP</span>
								<span>{formatCep(partner.cep)}</span>
							</div>
							<div className="grid grid-cols-[100px_1fr] items-center">
								<span className="font-medium text-muted-foreground">Logradouro</span>
								<span>
									{partner.street}, {partner.number}
								</span>
							</div>
							{partner.complement && (
								<div className="grid grid-cols-[100px_1fr] items-center">
									<span className="font-medium text-muted-foreground">Complemento</span>
									<span>{partner.complement}</span>
								</div>
							)}
							<div className="grid grid-cols-[100px_1fr] items-center">
								<span className="font-medium text-muted-foreground">Bairro</span>
								<span>{partner.neighborhood}</span>
							</div>
							<div className="grid grid-cols-[100px_1fr] items-center">
								<span className="font-medium text-muted-foreground">Cidade/UF</span>
								<span>
									{partner.city}/{partner.state}
								</span>
							</div>
						</div>
					</div>
				</PopoverContent>
			</Popover>
		</>
	)
}

export { PartnerActions }
