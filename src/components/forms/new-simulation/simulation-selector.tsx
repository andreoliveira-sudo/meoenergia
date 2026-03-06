"use client"

import { useQuery } from "@tanstack/react-query"

import { getAllPartnersWithSeller, getPartnersBySellerId } from "@/actions/partners"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useSimulation } from "@/contexts/simulation-context"
import type { Database } from "@/lib/definitions/supabase"
import { useEffect } from "react"

type UserRole = Database["public"]["Enums"]["user_role"]

interface SimulationSelectorProps {
	userRole: UserRole
}

export function SimulationSelector({ userRole }: SimulationSelectorProps) {
	const { setSellerId, setPartnerId, setPartnerName, setSellerName, sellerId, partnerId } = useSimulation()

	// Para admin: busca todos os partners com dados do seller
	const { data: allPartnersWithSeller = [], isLoading: isLoadingAllPartners } = useQuery({
		queryKey: ["all-partners-with-seller"],
		queryFn: getAllPartnersWithSeller,
		enabled: userRole === "admin"
	})

	// Para seller: busca apenas os partners do seller logado
	const { data: sellerPartners = [], isLoading: isLoadingSellerPartners } = useQuery({
		queryKey: ["partners-by-seller", sellerId],
		queryFn: () => (sellerId ? getPartnersBySellerId(sellerId) : Promise.resolve([])),
		enabled: userRole === "seller" && !!sellerId
	})

	const handlePartnerChangeForAdmin = (partnerId: string) => {
		const selectedPartner = allPartnersWithSeller.find((p) => p.id === partnerId)
		if (selectedPartner) {
			setPartnerId(partnerId)
			setPartnerName(selectedPartner.legal_business_name)
			if (selectedPartner.seller_id) {
				setSellerId(selectedPartner.seller_id)
			}
			if (selectedPartner.seller_name) {
				setSellerName(selectedPartner.seller_name.split(" ")[0])
			}
		}
	}

	const handlePartnerChangeForSeller = (partnerId: string) => {
		const selectedPartner = sellerPartners.find((p) => p.id === partnerId)
		if (selectedPartner) {
			setPartnerId(partnerId)
			setPartnerName(selectedPartner.legal_business_name)
		}
	}

	if (userRole === "admin") {
		return (
			<Card className="mx-auto w-full border-0 border-b shadow-none rounded-none mb-8 pb-8">
				<CardHeader className="p-0">
					<CardTitle>Contexto da Simulação</CardTitle>
					<CardDescription>Para qual parceiro esta simulação está sendo criada?</CardDescription>
				</CardHeader>
				<CardContent className="p-0 pt-4">
					<div className="space-y-2">
						<Label htmlFor="partner-select">Parceiro</Label>
						{isLoadingAllPartners ? (
							<Skeleton className="h-10 w-full" />
						) : (
							<Select value={partnerId || ""} onValueChange={handlePartnerChangeForAdmin}>
								<SelectTrigger id="partner-select">
									<SelectValue placeholder="Selecione um parceiro" />
								</SelectTrigger>
								<SelectContent>
									{allPartnersWithSeller.map((partner) => (
										<SelectItem key={partner.id} value={partner.id}>
											{partner.legal_business_name} - {partner.seller_name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
					</div>
				</CardContent>
			</Card>
		)
	}

	if (userRole === "seller") {
		return (
			<Card className="mx-auto w-full border-0 border-b shadow-none rounded-none mb-8 pb-8">
				<CardHeader className="p-0">
					<CardTitle>Contexto da Simulação</CardTitle>
					<CardDescription>Para qual parceiro esta simulação está sendo criada?</CardDescription>
				</CardHeader>
				<CardContent className="p-0 pt-4">
					<div className="space-y-2">
						<Label htmlFor="partner-select">Parceiro</Label>
						{isLoadingSellerPartners ? (
							<Skeleton className="h-10 w-full" />
						) : (
							<Select value={partnerId || ""} onValueChange={handlePartnerChangeForSeller} disabled={sellerPartners.length === 0}>
								<SelectTrigger id="partner-select">
									<SelectValue placeholder={sellerPartners.length === 0 ? "Nenhum parceiro encontrado" : "Selecione um parceiro"} />
								</SelectTrigger>
								<SelectContent>
									{sellerPartners.map((partner) => (
										<SelectItem key={partner.id} value={partner.id}>
											{partner.legal_business_name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
					</div>
				</CardContent>
			</Card>
		)
	}

	return null
}
