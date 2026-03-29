"use client"

import { X } from "lucide-react"
import { useMemo } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ServerFacetedFilter } from "@/components/ui/server-faceted-filter"

const creditStatusOptions = [
	{ label: "Ag. Análise", value: "analysis_pending" },
	{ label: "Aprovado", value: "analysis_approved" },
	{ label: "Reprovado", value: "analysis_rejected" },
]

const orderStatusOptions = [
	{ label: "Em revisão", value: "in_review" },
	{ label: "Cancelado", value: "rejected" },
	{ label: "Ag. Documentos", value: "documents_pending" },
	{ label: "Analisando Docs", value: "docs_analysis" },
	{ label: "Pendência documentos", value: "documents_issue" },
	{ label: "Aguardando assinatura", value: "awaiting_signature" },
	{ label: "Aguardando docs distribuidor", value: "awaiting_distributor_docs" },
	{ label: "Analisando docs distribuidor", value: "analyzing_distributor_docs" },
	{ label: "Pendência docs distribuidor", value: "distributor_docs_issue" },
	{ label: "Equipamentos em Separação", value: "equipment_separation" },
	{ label: "Equipamentos em Trânsito", value: "equipment_transit" },
	{ label: "Equipamento entregue", value: "equipment_delivered" },
	{ label: "Aguardando docs integrador", value: "awaiting_integrator_docs" },
	{ label: "Analisando docs integrador", value: "analyzing_integrator_docs" },
	{ label: "Pendência docs integrador", value: "integrator_docs_issue" },
]

interface OrdersTableToolbarProps {
	searchFilter: string
	onSearchChange: (value: string) => void
	statusFilter: string[]
	onStatusChange: (values: string[]) => void
	orderStatusFilter: string[]
	onOrderStatusChange: (values: string[]) => void
	stateFilter: string[]
	onStateChange: (values: string[]) => void
	cityFilter: string[]
	onCityChange: (values: string[]) => void
	partnerFilter: string[]
	onPartnerChange: (values: string[]) => void
	managerFilter: string[]
	onManagerChange: (values: string[]) => void
	creatorFilter: string[]
	onCreatorChange: (values: string[]) => void
	dateFromFilter: string
	onDateFromChange: (value: string) => void
	dateToFilter: string
	onDateToChange: (value: string) => void
	facets: {
		states: string[]
		cities: string[]
		partners: string[]
		managers: string[]
		creators: string[]
	}
	hasActiveFilters: boolean
	onClearFilters: () => void
}

export const OrdersTableToolbar = ({
	searchFilter,
	onSearchChange,
	statusFilter,
	onStatusChange,
	orderStatusFilter,
	onOrderStatusChange,
	stateFilter,
	onStateChange,
	cityFilter,
	onCityChange,
	partnerFilter,
	onPartnerChange,
	managerFilter,
	onManagerChange,
	creatorFilter,
	onCreatorChange,
	dateFromFilter,
	onDateFromChange,
	dateToFilter,
	onDateToChange,
	facets,
	hasActiveFilters,
	onClearFilters
}: OrdersTableToolbarProps) => {
	const stateOptions = useMemo(() => facets.states.map((v) => ({ label: v, value: v })), [facets.states])
	const cityOptions = useMemo(() => facets.cities.map((v) => ({ label: v, value: v })), [facets.cities])
	const partnerOptions = useMemo(() => facets.partners.map((v) => ({ label: v, value: v })), [facets.partners])
	const managerOptions = useMemo(() => facets.managers.map((v) => ({ label: v, value: v })), [facets.managers])
	const creatorOptions = useMemo(() => facets.creators.map((v) => ({ label: v, value: v })), [facets.creators])

	return (
		<div className="flex items-center justify-between">
			<div className="flex flex-1 flex-wrap items-center gap-2">
				<Input
					placeholder="Filtrar por Cliente..."
					value={searchFilter}
					onChange={(e) => onSearchChange(e.target.value)}
					className="h-8 w-[150px] lg:w-[250px]"
				/>

				{/* Estado */}
				<ServerFacetedFilter title="Estado" selectedValues={stateFilter} onChange={onStateChange} options={stateOptions} />

				{/* Cidade */}
				<ServerFacetedFilter title="Cidade" selectedValues={cityFilter} onChange={onCityChange} options={cityOptions} />

				{/* Parceiro */}
				<ServerFacetedFilter title="Parceiro" selectedValues={partnerFilter} onChange={onPartnerChange} options={partnerOptions} />

				{/* Gestor Interno */}
				<ServerFacetedFilter title="Gestor Interno" selectedValues={managerFilter} onChange={onManagerChange} options={managerOptions} />

				{/* Status Crédito */}
				<ServerFacetedFilter title="St. Crédito" selectedValues={statusFilter} onChange={onStatusChange} options={creditStatusOptions} />

				{/* Status Pedido */}
				<ServerFacetedFilter title="St. Pedido" selectedValues={orderStatusFilter} onChange={onOrderStatusChange} options={orderStatusOptions} />

				{/* Criado por */}
				<ServerFacetedFilter title="Criado por" selectedValues={creatorFilter} onChange={onCreatorChange} options={creatorOptions} />

				{/* Intervalo de datas */}
				<div className="flex items-center gap-2">
					<Input
						type="date"
						className="h-8 w-[140px]"
						value={dateFromFilter}
						onChange={(e) => onDateFromChange(e.target.value)}
					/>
					<span className="text-xs text-muted-foreground">até</span>
					<Input
						type="date"
						className="h-8 w-[140px]"
						value={dateToFilter}
						onChange={(e) => onDateToChange(e.target.value)}
					/>
				</div>

				{hasActiveFilters && (
					<Button variant="ghost" onClick={onClearFilters} className="h-8 px-2 lg:px-3">
						Limpar
						<X className="ml-2 h-4 w-4" />
					</Button>
				)}
			</div>
		</div>
	)
}
