// src/components/data-tables/simulations/simulations-table-actions.tsx
"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Copy, DollarSign, Download, Edit, Eye, FileDown, Loader2, RefreshCw, Send, Trash2 } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { hasPermission } from "@/actions/auth"
import { createOrderFromSimulation } from "@/actions/orders"
import { deleteSimulation, downloadSimulationFiles, generateSimulationPdf, listSimulationFiles } from "@/actions/simulations"
import { duplicateSimulation } from "@/actions/simulations/duplicate-simulation"
import { EditSimulationDialog } from "@/components/dialogs/edit-simulation-dialog"
import { EditSimulationRatesDialog } from "@/components/dialogs/edit-simulation-rates-dialog"
import { UpdateStatusDialog } from "@/components/dialogs/update-status-dialog"
import { ViewSimulationSheet } from "@/components/dialogs/view-simulation-sheet"
import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { documentFields } from "@/lib/constants"
import type { SimulationWithRelations } from "@/lib/definitions/simulations"

type DocumentFieldName = (typeof documentFields)[number]["name"]

export const SimulationsTableActions = ({ simulation }: { simulation: SimulationWithRelations }) => {
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
	const [isViewSheetOpen, setIsViewSheetOpen] = useState(false)
	const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
	const [isManageRatesDialogOpen, setIsManageRatesDialogOpen] = useState(false)
	const [isDeletePending, startDeleteTransition] = useTransition()
	const [isCreateOrderPending, startCreateOrderTransition] = useTransition()
	const [isPdfPending, startPdfTransition] = useTransition()
	const [isDownloadPending, startDownloadTransition] = useTransition()
	const [isDuplicatePending, startDuplicateTransition] = useTransition()
	const [isDownloadDropdownOpen, setIsDownloadDropdownOpen] = useState(false)
	const [selectedDocs, setSelectedDocs] = useState<Set<DocumentFieldName>>(new Set())

	const queryClient = useQueryClient()

	const { data: canCreateSimulations } = useQuery({
		queryKey: ["permission", "simulations:create"],
		queryFn: () => hasPermission("simulations:create")
	})

	const { data: canManageRates } = useQuery({
		queryKey: ["permission", "simulations:rates:manage"],
		queryFn: () => hasPermission("simulations:rates:manage")
	})

	const { data: availableFiles, isLoading: isLoadingFiles } = useQuery({
		queryKey: ["simulation-files", simulation.id],
		queryFn: () => listSimulationFiles(simulation.id),
		enabled: isDownloadDropdownOpen, // Apenas busca quando o dropdown é aberto
		staleTime: 5 * 60 * 1000 // Cache por 5 minutos
	})

	const handleDelete = () => {
		startDeleteTransition(() => {
			toast.promise(
				deleteSimulation({
					simulationId: simulation.id
				}),
				{
					loading: "Deletando simulação...",
					success: (res) => {
						queryClient.invalidateQueries({ queryKey: ["simulations"] })
						return res.message
					},
					error: (err) => {
						return err.message
					}
				}
			)
		})
	}

	const handleCreateOrder = () => {
		startCreateOrderTransition(() => {
			toast.promise(createOrderFromSimulation(simulation.id), {
				loading: "Criando pedido...",
				success: (res) => {
					if (res.success) {
						queryClient.invalidateQueries({ queryKey: ["orders"] })
						return res.message
					}
					throw new Error(res.message)
				},
				error: (err: Error) => {
					return err.message || "Ocorreu um erro inesperado."
				}
			})
		})
	}

	const handleDownloadPdf = () => {
		startPdfTransition(() => {
			toast.promise(generateSimulationPdf(simulation.id), {
				loading: "Gerando PDF da proposta...",
				success: (result) => {
					if (!result.success) {
						throw new Error(result.message)
					}
					const link = document.createElement("a")
					link.href = `data:application/pdf;base64,${result.data.pdfBase64}`
					const safeCompanyName = simulation.company_name
						.trim()
						.toLowerCase()
						.normalize("NFD") // separa acentos
						.replace(/[\u0300-\u036f]/g, "") // remove acentos
						.replace(/\s+/g, "_") // espaços -> _
						.replace(/[^a-z0-9_]/g, "") // remove tudo que não for letra, número ou "_"
					link.download = `proposta-simulacao-${safeCompanyName || "cliente"}.pdf`
					document.body.appendChild(link)
					link.click()
					document.body.removeChild(link)
					return "PDF gerado com sucesso! O download deve começar em breve."
				},
				error: (err: Error) => err.message
			})
		})
	}

	const handleFileDownload = () => {
		if (selectedDocs.size === 0) {
			toast.info("Nenhum documento selecionado", {
				description: "Por favor, selecione pelo menos um documento para baixar."
			})
			return
		}

		startDownloadTransition(() => {
			toast.promise(
				downloadSimulationFiles({
					simulationId: simulation.id,
					documentNames: Array.from(selectedDocs),
					customerId: simulation.customerId
				}),
				{
					loading: "Preparando arquivos para download...",
					success: (result) => {
						if (!result.success) {
							throw new Error(result.message)
						}

						const link = document.createElement("a")
						link.href = `data:${result.data.contentType};base64,${result.data.fileBase64}`
						link.download = result.data.fileName
						document.body.appendChild(link)
						link.click()
						document.body.removeChild(link)

						return "Download iniciado!"
					},
					error: (err: Error) => err.message
				}
			)
		})
	}

	const handleDuplicateSimulation = () => {
		startDuplicateTransition(() => {
			toast.promise(duplicateSimulation(simulation.id), {
				loading: "Duplicando simulação...",
				success: (res) => {
					if (res.success) {
						// Recarrega a lista de simulações para aparecer a nova
						queryClient.invalidateQueries({ queryKey: ["simulations"] })
						return res.message || "Simulação duplicada com sucesso!"
					}

					throw new Error(res.message)
				},
				error: (err: Error) => {
					return err.message || "Ocorreu um erro ao duplicar a simulação."
				}
			})
		})
	}

	const existingDocumentFields = documentFields.filter((docField) => availableFiles?.success && availableFiles.data.some((file) => file.name === docField.name))

	return (
		<>
			<div className="flex items-center justify-center space-x-1 alternative-buttons">
				<Tooltip>
					<TooltipTrigger asChild>
						<Button variant="ghost" size="icon" onClick={() => setIsViewSheetOpen(true)}>
							<Eye className="h-4 w-4" />
							<span className="sr-only">Visualizar Detalhes</span>
						</Button>
					</TooltipTrigger>
					<TooltipContent>Visualizar Detalhes</TooltipContent>
				</Tooltip>

				{canCreateSimulations && (
					<>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button variant="ghost" size="icon" onClick={() => setIsEditDialogOpen(true)}>
									<Edit className="h-4 w-4" />
									<span className="sr-only">Editar Simulação</span>
								</Button>
							</TooltipTrigger>
							<TooltipContent>Editar Simulação</TooltipContent>
						</Tooltip>

						<Tooltip>
							<TooltipTrigger asChild>
								<Button variant="ghost" size="icon" onClick={() => setIsStatusDialogOpen(true)}>
									<RefreshCw className="h-4 w-4" />
									<span className="sr-only">Alterar Status</span>
								</Button>
							</TooltipTrigger>
							<TooltipContent>Alterar Status</TooltipContent>
						</Tooltip>
					</>
				)}

				{canManageRates && (
					<Tooltip>
						<TooltipTrigger asChild>
							<Button variant="ghost" size="icon" onClick={() => setIsManageRatesDialogOpen(true)}>
								<DollarSign className="h-4 w-4" />
								<span className="sr-only">Alterar taxas</span>
							</Button>
						</TooltipTrigger>
						<TooltipContent>Alterar taxas</TooltipContent>
					</Tooltip>
				)}

				<Tooltip>
					<TooltipTrigger asChild>
						<Button variant="ghost" size="icon" onClick={handleDownloadPdf} disabled={isPdfPending}>
							{isPdfPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
							<span className="sr-only">Baixar Proposta</span>
						</Button>
					</TooltipTrigger>
					<TooltipContent>Baixar Proposta PDF</TooltipContent>
				</Tooltip>

				<DropdownMenu
					open={isDownloadDropdownOpen}
					onOpenChange={(open) => {
						setIsDownloadDropdownOpen(open)
						if (!open) {
							setSelectedDocs(new Set())
						}
					}}
				>
					<Tooltip>
						<TooltipTrigger asChild>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon" disabled={isDownloadPending}>
									{isDownloadPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
									<span className="sr-only">Baixar Documentos</span>
								</Button>
							</DropdownMenuTrigger>
						</TooltipTrigger>
						<TooltipContent>Baixar Documentos Anexados</TooltipContent>
					</Tooltip>
					<DropdownMenuContent align="end">
						<DropdownMenuLabel>Selecione para baixar</DropdownMenuLabel>
						<DropdownMenuSeparator />
						{isLoadingFiles ? (
							<DropdownMenuItem disabled>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Carregando...
							</DropdownMenuItem>
						) : existingDocumentFields.length > 0 ? (
							<>
								{existingDocumentFields.map((doc) => (
									<DropdownMenuCheckboxItem
										key={doc.name}
										checked={selectedDocs.has(doc.name)}
										onSelect={(e) => e.preventDefault()}
										onCheckedChange={(checked) => {
											setSelectedDocs((prev) => {
												const newSet = new Set(prev)
												if (checked) {
													newSet.add(doc.name)
												} else {
													newSet.delete(doc.name)
												}
												return newSet
											})
										}}
									>
										{doc.label.replace(" *", "")}
									</DropdownMenuCheckboxItem>
								))}
								<DropdownMenuSeparator />
								<DropdownMenuItem onSelect={handleFileDownload} disabled={selectedDocs.size === 0}>
									<Download className="mr-2 h-4 w-4" />
									Baixar {selectedDocs.size > 0 ? `(${selectedDocs.size})` : ""}
								</DropdownMenuItem>
							</>
						) : (
							<DropdownMenuItem disabled>Nenhum documento anexado</DropdownMenuItem>
						)}
					</DropdownMenuContent>
				</DropdownMenu>

				{canCreateSimulations && (
					<>
						{/* 👇 NOVO: duplicar simulação */}
						<Tooltip>
							<TooltipTrigger asChild>
								<Button className="duplicate-simulation-button" variant="ghost" size="icon" onClick={handleDuplicateSimulation} disabled={isDuplicatePending}>
									{isDuplicatePending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
									<span className="sr-only">Duplicar Simulação</span>
								</Button>
							</TooltipTrigger>
							<TooltipContent>Duplicar Simulação</TooltipContent>
						</Tooltip>

						<Tooltip>
							<TooltipTrigger asChild>
								<Button className="create-order-button" variant="ghost" size="icon" onClick={handleCreateOrder} disabled={isCreateOrderPending}>
									{isCreateOrderPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
									<span className="sr-only">Criar Pedido</span>
								</Button>
							</TooltipTrigger>
							<TooltipContent>Criar Pedido</TooltipContent>
						</Tooltip>

						<Tooltip>
							<TooltipTrigger asChild>
								<Button className="delete-button" variant="ghost" size="icon" onClick={handleDelete} disabled={isDeletePending}>
									{isDeletePending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
									<span className="sr-only">Deletar</span>
								</Button>
							</TooltipTrigger>
							<TooltipContent className="tooltip-content bg-destructive fill-destructive text-white">Deletar Simulação</TooltipContent>
						</Tooltip>
					</>
				)}
			</div>

			<EditSimulationRatesDialog simulationId={simulation.id} open={isManageRatesDialogOpen} onOpenChange={setIsManageRatesDialogOpen} />
			<EditSimulationDialog simulationId={simulation.id} open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} />
			<ViewSimulationSheet simulationId={simulation.id} open={isViewSheetOpen} onOpenChange={setIsViewSheetOpen} />
			<UpdateStatusDialog simulation={simulation} open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen} />
		</>
	)
}
