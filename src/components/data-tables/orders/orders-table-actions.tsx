"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { DollarSign, Download, Edit, Eye, FileDown, Info, Loader2, RefreshCw, Trash2 } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { hasPermission } from "@/actions/auth"
import { deleteOrder, generateOrderPdf, listOrderFiles } from "@/actions/orders"
import { downloadSimulationFiles } from "@/actions/simulations"
import { EditOrderDialog } from "@/components/dialogs/edit-order-dialog"
import { EditRatesDialog } from "@/components/dialogs/edit-rates-dialog"
import { UpdateOrderStatusDialog } from "@/components/dialogs/update-order-status-dialog"
import { ViewOrderSheet } from "@/components/dialogs/view-order-sheet"
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
import type { OrderWithRelations } from "@/lib/definitions/orders"

type DocumentFieldName = (typeof documentFields)[number]["name"]

export const OrdersTableActions = ({ order }: { order: OrderWithRelations }) => {
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
	const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
	const [isManageRatesDialogOpen, setIsManageRatesDialogOpen] = useState(false)
	const [isViewSheetOpen, setIsViewSheetOpen] = useState(false)
	const [isDeletePending, startDeleteTransition] = useTransition()
	const [isPdfPending, startPdfTransition] = useTransition()
	const [isDownloadPending, startDownloadTransition] = useTransition()
	const [isDownloadDropdownOpen, setIsDownloadDropdownOpen] = useState(false)
	const [selectedDocs, setSelectedDocs] = useState<Set<DocumentFieldName>>(new Set())

	const queryClient = useQueryClient()

	const { data: canManageStatus } = useQuery({
		queryKey: ["permission", "orders:status"],
		queryFn: () => hasPermission("orders:status")
	})

	const { data: canManageRates } = useQuery({
		queryKey: ["permission", "orders:rates:manage"],
		queryFn: () => hasPermission("orders:rates:manage")
	})

	const { data: availableFiles, isLoading: isLoadingFiles } = useQuery({
		queryKey: ["order-files", order.id],
		queryFn: () => listOrderFiles(order.id),
		enabled: isDownloadDropdownOpen, // Apenas busca quando o dropdown é aberto
		staleTime: 5 * 60 * 1000 // Cache por 5 minutos
	})

	const handleDelete = () => {
		startDeleteTransition(() => {
			toast.promise(deleteOrder(order.id), {
				loading: "Deletando pedido...",
				success: (res) => {
					if (res.success) {
						queryClient.invalidateQueries({ queryKey: ["orders"] })
						return res.message
					}
					throw new Error(res.message)
				},
				error: (err: Error) => err.message
			})
		})
	}

	const handleDownloadPdf = () => {
		startPdfTransition(() => {
			toast.promise(generateOrderPdf(order.id), {
				loading: "Gerando PDF da proposta...",
				success: (result) => {
					if (!result.success) {
						throw new Error(result.message)
					}
					// Cria um link temporário para o download
					const link = document.createElement("a")
					link.href = `data:application/pdf;base64,${result.data.pdfBase64}`
					link.download = `proposta-pedido-${order.kdi}.pdf`
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
					simulationId: order.id, // Reutilizando a action de simulação, pois o ID é o mesmo
					documentNames: Array.from(selectedDocs),
					customerId: order.customerId
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

	const existingDocumentFields = documentFields.filter((docField) => availableFiles?.success && availableFiles.data.some((file) => file.name === docField.name))

	return (
		<>
			<div className="flex items-center justify-center gap-x-2 alternative-buttons">
				{order.notes && (
					<Tooltip>
						<TooltipTrigger asChild>
							<Button variant="ghost" size="icon" className="bg-transparent!">
								<Info className="size-6 text-orange-400!" />
								<span className="sr-only">Visualizar Detalhes</span>
							</Button>
						</TooltipTrigger>
						<TooltipContent>Observações: {order.notes}</TooltipContent>
					</Tooltip>
				)}

				<Tooltip>
					<TooltipTrigger asChild>
						<Button variant="ghost" size="icon" onClick={() => setIsViewSheetOpen(true)}>
							<Eye className="h-4 w-4" />
							<span className="sr-only">Visualizar Detalhes</span>
						</Button>
					</TooltipTrigger>
					<TooltipContent>Visualizar Detalhes</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<Button variant="ghost" size="icon" onClick={() => setIsEditDialogOpen(true)}>
							<Edit className="h-4 w-4" />
							<span className="sr-only">Editar Pedido</span>
						</Button>
					</TooltipTrigger>
					<TooltipContent>Editar Pedido</TooltipContent>
				</Tooltip>

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

				{canManageStatus && (
					<Tooltip>
						<TooltipTrigger asChild>
							<Button variant="ghost" size="icon" onClick={() => setIsStatusDialogOpen(true)}>
								<RefreshCw className="h-4 w-4" />
								<span className="sr-only">Alterar Status</span>
							</Button>
						</TooltipTrigger>
						<TooltipContent>Alterar Status</TooltipContent>
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

				<Tooltip>
					<TooltipTrigger asChild>
						<Button className="delete-button" variant="ghost" size="icon" onClick={handleDelete} disabled={isDeletePending}>
							{isDeletePending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
							<span className="sr-only">Deletar</span>
						</Button>
					</TooltipTrigger>
					<TooltipContent className="tooltip-content bg-destructive fill-destructive text-white">Deletar Pedido</TooltipContent>
				</Tooltip>
			</div>

			<EditRatesDialog orderId={order.id} open={isManageRatesDialogOpen} onOpenChange={setIsManageRatesDialogOpen} />
			<EditOrderDialog orderId={order.id} open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} />
			<UpdateOrderStatusDialog order={order} open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen} />
			<ViewOrderSheet orderId={order.id} open={isViewSheetOpen} onOpenChange={setIsViewSheetOpen} />
		</>
	)
}
