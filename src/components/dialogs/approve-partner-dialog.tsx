"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { CheckCircle, Loader2 } from "lucide-react"
import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"

import { approvePartner } from "@/actions/partners"
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
	const [isPending, startTransition] = useTransition()
	const queryClient = useQueryClient()

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

		startTransition(() => {
			toast.promise(approvePartner({ partnerId: partner.id, sellerId: selectedSeller }), {
				loading: "Aprovando parceiro...",
				success: (result) => {
					if (result.success) {
						queryClient.invalidateQueries({ queryKey: ["partners"] })
						onOpenChange(false)
						return result.message
					} else {
						// Lança um erro para que seja capturado pelo `error` do toast.promise
						throw new Error(result.message)
					}
				},
				error: (err: Error) => {
					// O erro lançado no `success` ou um erro inesperado da action é capturado aqui
					return err.message
				}
			})
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
						<Label htmlFor="seller-select">Vendedor Responsável</Label>
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
					<Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
						Cancelar
					</Button>
					<Button onClick={handleApprove} disabled={isPending || isLoadingSellers || !selectedSeller}>
						{isPending ? <Loader2 className="animate-spin" /> : <CheckCircle />}
						Aprovar Parceiro
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
