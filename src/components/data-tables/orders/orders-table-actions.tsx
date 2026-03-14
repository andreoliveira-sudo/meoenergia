"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { DollarSign, Download, Edit, Eye, FileDown, FileText, Info, Loader2, RefreshCw, Trash2, X as XIcon } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { hasPermission } from "@/actions/auth"
import { deleteOrder, generateOrderPdf, listOrderFiles } from "@/actions/orders"
import { downloadSimulationFiles } from "@/actions/simulations"
import { useOperationFeedback } from "@/components/feedback/operation-feedback"
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
	const { execute } = useOperationFeedback()

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

	// Check if this order has a RevoCred integration log
	const { data: hasRevocredLog } = useQuery({
		queryKey: ["revocred-log-check", order.kdi],
		queryFn: async () => {
			const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/api/v1/revocred/log/check?kdis=${order.kdi}`)
			const data = await res.json()
			return (data.kdisWithLogs || []).includes(String(order.kdi))
		},
		staleTime: 60 * 1000 // Cache 1 minute
	})

	const [isLogDialogOpen, setIsLogDialogOpen] = useState(false)
	const [logData, setLogData] = useState<Record<string, unknown> | null>(null)
	const [isLogLoading, setIsLogLoading] = useState(false)

	const handleViewLog = async () => {
		setIsLogDialogOpen(true)
		setIsLogLoading(true)
		setLogData(null)
		try {
			const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/api/v1/revocred/log?kdi=${order.kdi}`)
			const data = await res.json()
			if (data.log) {
				setLogData(data.log)
			}
		} catch {
			setLogData(null)
		} finally {
			setIsLogLoading(false)
		}
	}

	const handleDelete = () => {
		startDeleteTransition(() => {
			execute({
				action: () => deleteOrder(order.id),
				loadingMessage: "Deletando pedido...",
				successMessage: (res) => res.message,
				onSuccess: () => {
					queryClient.invalidateQueries({ queryKey: ["orders"] })
					queryClient.invalidateQueries({ queryKey: ["orders-paginated"] })
					queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
				}
			})
		})
	}

	const handleDownloadPdf = () => {
		startPdfTransition(() => {
			window.open((process.env.NEXT_PUBLIC_BASE_PATH || "") + "/api/v1/pdf/" + order.id, "_blank")
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
			execute({
				action: () =>
					downloadSimulationFiles({
						simulationId: order.id, // Reutilizando a action de simulação, pois o ID é o mesmo
						documentNames: Array.from(selectedDocs),
						customerId: order.customerId
					}),
				loadingMessage: "Preparando arquivos para download...",
				successMessage: () => "Download iniciado!",
				onSuccess: (result) => {
					if (!result.success) return
					const link = document.createElement("a")
					link.href = `data:${result.data.contentType};base64,${result.data.fileBase64}`
					link.download = result.data.fileName
					document.body.appendChild(link)
					link.click()
					document.body.removeChild(link)
				}
			})
		})
	}

	const existingDocumentFields = documentFields.filter((docField) => availableFiles?.success && availableFiles.data.some((file) => file.name === docField.name))

	return (
		<>
			<div className="flex items-center justify-center gap-x-2 alternative-buttons">
				{hasRevocredLog && (
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								onClick={handleViewLog}
								className="bg-orange-50 hover:bg-orange-100 border border-orange-200"
							>
								<FileText className="h-4 w-4 text-orange-600" />
								<span className="sr-only">Log RevoCred</span>
							</Button>
						</TooltipTrigger>
						<TooltipContent className="bg-orange-600 text-white">Log de Integração RevoCred</TooltipContent>
					</Tooltip>
				)}

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

			{/* RevoCred Integration Log Dialog */}
			{isLogDialogOpen && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
					onClick={(e) => { if (e.target === e.currentTarget) setIsLogDialogOpen(false) }}
				>
					<div className="relative w-full max-w-lg mx-4 bg-white rounded-xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
						{/* Header */}
						<div className="flex items-center justify-between px-5 py-3 border-b border-orange-100 bg-orange-50 flex-shrink-0">
							<div className="flex items-center gap-2">
								<FileText className="w-4 h-4 text-orange-600" />
								<h3 className="text-sm font-semibold text-orange-800">Log de Integração RevoCred</h3>
								<span className="px-2 py-0.5 text-[10px] font-mono bg-orange-200 text-orange-800 rounded">KDI {order.kdi}</span>
							</div>
							<button onClick={() => setIsLogDialogOpen(false)} className="p-1 rounded-lg text-orange-400 hover:text-orange-600 hover:bg-orange-100 transition-colors">
								<XIcon className="w-4 h-4" />
							</button>
						</div>

						{/* Body */}
						<div className="px-5 py-4 overflow-y-auto flex-1">
							{isLogLoading && (
								<div className="flex items-center justify-center gap-2 py-8 text-sm text-orange-600">
									<Loader2 className="w-4 h-4 animate-spin" /> Carregando log...
								</div>
							)}
							{!isLogLoading && !logData && (
								<p className="text-sm text-gray-400 text-center py-8">Nenhum log encontrado para este pedido.</p>
							)}
							{!isLogLoading && logData && (() => {
								const ld = logData as Record<string, string | number | boolean | null | Array<Record<string, string>>>;
								const parcelasList = Array.isArray(ld.parcelas) ? ld.parcelas as Array<Record<string, string>> : [];
								const stepsList = Array.isArray((logData as Record<string, unknown>).steps_log) ? (logData as Record<string, unknown>).steps_log as Array<Record<string, string>> : [];
								return (
								<div className="space-y-4">
									{/* Result badge */}
									<div className="flex items-center gap-3">
										<span className={`px-3 py-1 rounded-full text-xs font-bold ${
											ld.resultado === "APROVADO" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
										}`}>
											{String(ld.resultado)}
										</span>
										<span className="text-xs text-gray-400">
											{ld.created_at ? new Date(String(ld.created_at)).toLocaleString("pt-BR") : ""}
										</span>
									</div>

									{/* Info grid */}
									<div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
										<div><span className="text-gray-400">Cliente:</span> <span className="text-gray-700 font-medium">{String(ld.customer_name || "—")}</span></div>
										<div><span className="text-gray-400">Modo:</span> <span className="text-gray-700 capitalize">{String(ld.mode || "—")}</span></div>
										<div><span className="text-gray-400">CPF/CNPJ:</span> <span className="text-gray-700">{String(ld.cpf_cnpj || "—")}</span></div>
										<div><span className="text-gray-400">Duração:</span> <span className="text-gray-700">{ld.duration_ms ? `${(Number(ld.duration_ms) / 1000).toFixed(1)}s` : "—"}</span></div>
										<div><span className="text-gray-400">Potência:</span> <span className="text-gray-700">{ld.system_power ? `${String(ld.system_power)} kWp` : "—"}</span></div>
										<div><span className="text-gray-400">Equipamentos:</span> <span className="text-gray-700">{ld.equipment_value ? `R$ ${Number(ld.equipment_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}</span></div>
										<div><span className="text-gray-400">Mão de obra:</span> <span className="text-gray-700">{ld.labor_value ? `R$ ${Number(ld.labor_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}</span></div>
										<div><span className="text-gray-400">Conta luz:</span> <span className="text-gray-700">{ld.monthly_bill_value ? `R$ ${Number(ld.monthly_bill_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}</span></div>
										{ld.status_before ? (
											<div><span className="text-gray-400">Status anterior:</span> <span className="text-gray-700">{String(ld.status_before)}</span></div>
										) : null}
										{ld.status_updated_to ? (
											<div><span className="text-gray-400">Status atualizado:</span> <span className="text-green-700 font-medium">{String(ld.status_updated_to)}</span></div>
										) : null}
									</div>

									{/* Parcelas */}
									{parcelasList.length > 0 && (
										<div>
											<p className="text-[11px] text-orange-600 font-medium mb-1">Financiamento:</p>
											<div className="flex flex-wrap gap-1">
												{parcelasList.map((p, pi) => (
													<span key={pi} className="px-2 py-0.5 bg-orange-50 border border-orange-200 rounded text-[11px] text-gray-700">
														{p.prazo} de {p.valor} {p.taxa && `(${p.taxa})`}
													</span>
												))}
											</div>
										</div>
									)}

									{/* Detail text */}
									{ld.resultado_detail ? (
										<div>
											<p className="text-[11px] text-orange-600 font-medium mb-1">Detalhe retornado:</p>
											<p className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded border border-gray-100">{String(ld.resultado_detail)}</p>
										</div>
									) : null}

									{/* Error */}
									{ld.error_message ? (
										<div>
											<p className="text-[11px] text-red-600 font-medium mb-1">Erro:</p>
											<p className="text-xs text-red-600 bg-red-50 p-2.5 rounded border border-red-100">{String(ld.error_message)}</p>
										</div>
									) : null}

									{/* Steps timeline */}
									{stepsList.length > 0 && (
										<div>
											<p className="text-[11px] text-orange-600 font-medium mb-1">Etapas da automação:</p>
											<div className="space-y-0.5 bg-gray-50 p-2.5 rounded border border-gray-100">
												{stepsList.map((s, si) => (
													<div key={si} className="flex items-center gap-2 text-[11px]">
														<span className="text-gray-300 font-mono w-16 flex-shrink-0">
															{s.timestamp ? new Date(s.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—"}
														</span>
														<span className={`w-2 h-2 rounded-full flex-shrink-0 ${
															s.status === "done" ? "bg-green-400" : s.status === "error" ? "bg-red-400" : s.status === "running" ? "bg-blue-400" : "bg-gray-300"
														}`} />
														<span className="text-gray-600 font-medium">{s.step}</span>
														{s.detail ? <span className="text-gray-400 truncate ml-auto max-w-[180px]">{s.detail}</span> : null}
													</div>
												))}
											</div>
										</div>
									)}
								</div>
								);
							})()}
						</div>
					</div>
				</div>
			)}
		</>
	)
}
