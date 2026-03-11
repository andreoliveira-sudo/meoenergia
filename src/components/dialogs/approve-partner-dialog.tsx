"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { CheckCircle, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { approvePartner } from "@/actions/partners"
import { useOperationFeedback } from "@/components/feedback/operation-feedback"
import { getAllApprovedSellers } from "@/actions/sellers"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Partner } from "@/lib/definitions/partners"

interface ApprovePartnerDialogProps {
	partner: Partner
	open: boolean
	onOpenChange: (open: boolean) => void
}

export const ApprovePartnerDialog = ({ partner, open, onOpenChange }: ApprovePartnerDialogProps) => {
	const [selectedSeller, setSelectedSeller] = useState<string>("")
	const queryClient = useQueryClient()
	const { execute } = useOperationFeedback()

	const { data: sellers, isLoading: isLoadingSellers } = useQuery({
		queryKey: ["approved-sellers"],
		queryFn: getAllApprovedSellers,
		enabled: open
	})

	function handleApprove() {
		if (!selectedSeller) {
			toast.error("Por favor, selecione um vendedor.")
			return
		}

		execute({
			action: () => approvePartner({ partnerId: partner.id, sellerId: selectedSeller }),
			loadingMessage: "Aprovando parceiro...",
			successMessage: (res) => res.message,
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ["partners"] })
				queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
				onOpenChange(false)
			}
		})
	}

	useEffect(() => {
		if (!open) {
			setSelectedSeller("")
		}
	}, [open])

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Aprovar Parceiro</DialogTitle>
					<DialogDescription>Selecione um vendedor para associar a este parceiro antes de aprovar.</DialogDescription>
				</DialogHeader>
				<div className="space-y-4 py-4">
					<div className="space-y-2">
						<Label htmlFor="seller-select">Vendedor Responsavel</Label>
						{isLoadingSellers ? (
							<div className="flex items-center space-x-2">
								<Loader2 className="animate-spin" />
								<span>Carregando vendedores...</span>
							</div>
						) : (
							<Select value={selectedSeller} onValueChange={setSelectedSeller}>
								<SelectTrigger id="seller-select">
									<SelectValue placeholder="Selecione um vendedor" />
								</SelectTrigger>
								<SelectContent>
									{sellers?.map((seller) => (
										<SelectItem key={seller.id} value={seller.id}>
											{seller.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancelar
					</Button>
					<Button onClick={handleApprove} disabled={isLoadingSellers || !selectedSeller}>
						<CheckCircle />
						Aprovar Parceiro
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
