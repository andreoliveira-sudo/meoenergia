"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface SimulationContextType {
	partnerId: string | null
	setPartnerId: (id: string | null) => void
	sellerId: string | null
	setSellerId: (id: string | null) => void
	partnerName: string | null
	setPartnerName: (name: string | null) => void
	sellerName: string | null
	setSellerName: (name: string | null) => void
	isCustomerDataLocked: boolean
	setIsCustomerDataLocked: (locked: boolean) => void
	clearContext: () => void
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined)

export function SimulationProvider({ children }: { children: ReactNode }) {
	const [partnerId, setPartnerId] = useState<string | null>(null)
	const [sellerId, setSellerId] = useState<string | null>(null)
	const [partnerName, setPartnerName] = useState<string | null>(null)
	const [sellerName, setSellerName] = useState<string | null>(null)
	const [isCustomerDataLocked, setIsCustomerDataLocked] = useState<boolean>(false)

	const clearContext = () => {
		setPartnerId(null)
		setSellerId(null)
		setPartnerName(null)
		setSellerName(null)
		setIsCustomerDataLocked(false)
	}

	const value = {
		partnerId,
		setPartnerId,
		sellerId,
		setSellerId,
		partnerName,
		setPartnerName,
		sellerName,
		setSellerName,
		isCustomerDataLocked,
		setIsCustomerDataLocked,
		clearContext
	}

	return <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>
}

export function useSimulation() {
	const context = useContext(SimulationContext)
	if (context === undefined) {
		throw new Error("useSimulation must be used within a SimulationProvider")
	}
	return context
}
