"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RateForm } from "../forms/rate-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"

interface EditOrderDialogProps {
	orderId: string
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function EditRatesDialog({ orderId, open, onOpenChange }: EditOrderDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>Editar Taxas</DialogTitle>
					<DialogDescription>
						Altere as taxas apenas desse pedido. As alterações serão salvas ao final do processo e afetarão apenas esse Pedido.
					</DialogDescription>
				</DialogHeader>
				{/* A key garante que o componente e seu estado sejam resetados se o ID mudar */}
				{open && (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
						<Card>
							<CardHeader>
								<CardTitle>Taxa de Juros</CardTitle>
								<CardDescription>Defina a taxa de juros padrão a ser usada nos cálculos de parcelamento.</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<RateForm isEditingUniqueOrder orderId={orderId} rateId="interest_rate_36" />
								<RateForm isEditingUniqueOrder orderId={orderId} rateId="interest_rate_48" />
								<RateForm isEditingUniqueOrder orderId={orderId} rateId="interest_rate_60" />
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<CardTitle>Taxa de Serviços</CardTitle>
								<CardDescription>Defina a taxa de serviços a ser aplicada sobre o subtotal do projeto.</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<RateForm isEditingUniqueOrder orderId={orderId} rateId="service_fee_36" />
								<RateForm isEditingUniqueOrder orderId={orderId} rateId="service_fee_48" />
								<RateForm isEditingUniqueOrder orderId={orderId} rateId="service_fee_60" />
							</CardContent>
						</Card>
					</div>
				)}
			</DialogContent>
		</Dialog>
	)
}
