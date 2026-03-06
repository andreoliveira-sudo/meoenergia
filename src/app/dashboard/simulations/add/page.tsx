"use client"

import { useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { useEffect } from "react"

import { getCurrentUser } from "@/actions/auth"
import { getCurrentPartnerDetails } from "@/actions/partners"
import getPartnerByUserId from "@/actions/partners/get-partner-by-user-id" // Import da action
import { getSellerByUserId } from "@/actions/sellers"
import { NewSimulationForm } from "@/components/forms/new-simulation/new-simulation-form"
import { SimulationSelector } from "@/components/forms/new-simulation/simulation-selector"
import { SimulationProvider, useSimulation } from "@/contexts/simulation-context"

function SimulationPageContent() {
	const {
		data: user,
		isLoading: isLoadingUser,
		error: userError
	} = useQuery({
		queryKey: ["currentUser"],
		queryFn: getCurrentUser,
		staleTime: Infinity,
		refetchOnWindowFocus: false
	})

	const isPartner = user?.role === "partner"
	const isSeller = user?.role === "seller"

	const {
		data: partnerDetails,
		isLoading: isLoadingPartner,
		error: partnerError
	} = useQuery({
		queryKey: ["currentPartnerDetails"],
		queryFn: getCurrentPartnerDetails,
		enabled: isPartner
	})

	// Nova query: Busca o partner completo pelo user.id
	const {
		data: partnerQuery,
		isLoading: isLoadingPartnerData,
		error: partnerDataError
	} = useQuery({
		queryKey: ["partnerByUserId", user?.id],
		queryFn: () => {
			if (!user?.id) {
				return Promise.resolve(null)
			}
			return getPartnerByUserId(user.id)
		},
		enabled: isPartner && !!user?.id
	})
	const partnerData = partnerQuery?.success ? partnerQuery.data : null

	// Busca dados do seller pelo user.id quando o usuário for um seller
	const {
		data: sellerQuery,
		isLoading: isLoadingSeller,
		error: sellerError
	} = useQuery({
		queryKey: ["currentSellerDetails", user?.id],
		queryFn: () => {
			if (!user?.id) {
				return Promise.resolve(null)
			}
			return getSellerByUserId(user.id)
		},
		enabled: isSeller && !!user?.id
	})
	const sellerDetails = sellerQuery?.success ? sellerQuery.data : null

	const { setPartnerId, setSellerId, partnerId, sellerId, partnerName, sellerName, setPartnerName, setSellerName } = useSimulation()

	// Preenche o contexto automaticamente APENAS se o usuário for um parceiro
	useEffect(() => {
		if (isPartner && partnerData && partnerDetails?.sellerId && user?.name) {
			setPartnerId(partnerData.id) // Agora usa o partner.id correto
			setSellerId(partnerDetails.sellerId)
			setPartnerName(user.name) // Parceiro logado é o parceiro da simulação
		}
	}, [isPartner, partnerData, partnerDetails, user?.name, setPartnerId, setSellerId, setPartnerName])

	// Auto-preenche o sellerId se o usuário for um seller
	useEffect(() => {
		if (isSeller && sellerDetails) {
			setSellerId(sellerDetails.id)
			setSellerName(sellerDetails.name)
		}
	}, [isSeller, sellerDetails, setSellerId, setSellerName])

	const isLoading = isLoadingUser || (isPartner && (isLoadingPartner || isLoadingPartnerData)) || (isSeller && isLoadingSeller)

	const error = userError || (isPartner && (partnerError || partnerDataError)) || (sellerQuery && !sellerQuery.success)

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center gap-4 py-16">
				<Loader2 className="h-8 w-8 animate-spin" />
				<p>Carregando dados do usuário...</p>
			</div>
		)
	}

	if (error || !user?.role) {
		return <p className="text-destructive text-center">Não foi possível carregar os dados do usuário. Tente recarregar a página.</p>
	}

	const showAdminSelector = user.role === "admin"
	const showSellerSelector = user.role === "seller" && !!sellerId // Garante que o sellerId está pronto

	const isFormDisabled = (showAdminSelector || showSellerSelector) && !partnerId

	const getContextText = () => {
		if (!partnerId) return null

		if (user.role === "admin" && sellerName && partnerName) {
			return `para ${sellerName.split(" ")[0]} / ${partnerName}`
		}
		if (user.role === "seller" && partnerName) {
			return `para ${partnerName}`
		}
		return null
	}

	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Nova Simulação</h1>
					<p className="text-muted-foreground">Preencha os dados abaixo para criar uma nova simulação.</p>
				</div>
				{getContextText() && <p className="font-medium text-muted-foreground text-sm text-right">Criando simulação {getContextText()}</p>}
			</div>
			{showAdminSelector && <SimulationSelector userRole="admin" />}
			{showSellerSelector && <SimulationSelector userRole="seller" />}

			<NewSimulationForm isDisabled={isFormDisabled} />
		</div>
	)
}

const AddSimulationPage = () => {
	// O Provedor de Contexto agora envolve todo o conteúdo da página.
	return (
		<SimulationProvider>
			<SimulationPageContent />
		</SimulationProvider>
	)
}

export default AddSimulationPage
