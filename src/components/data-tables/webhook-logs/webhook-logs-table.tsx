"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo, useRef, useState } from "react"
import {
	getCoreRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable
} from "@tanstack/react-table"
import { AlertTriangle, CheckCircle2, Loader2, Pause, Play, XCircle } from "lucide-react"
import { toast } from "sonner"

import getWebhookLogs from "@/actions/developer/get-webhook-logs"
import { getOrdersForReplay, replaySingleWebhook, type ReplayOrder } from "@/actions/developer/resend-webhook"
import { columns } from "@/components/data-tables/webhook-logs/columns"
import { WebhookLogsTableToolbar } from "@/components/data-tables/webhook-logs/webhook-logs-table-toolbar"
import { DataTable } from "@/components/ui/data-table"
import { DataTableSkeleton } from "@/components/ui/data-table-skeleton"
import { DataTableViewOptions } from "@/components/ui/data-table-view-options"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { usePersistedTableState } from "@/hooks/use-persisted-table-state"

const WEBHOOK_LOGS_TABLE_STORAGE_KEY = "webhook-logs-table-state"

type ReplayStatus = "idle" | "loading" | "ready" | "running" | "paused" | "done"

function ReplayPanel() {
	const [dateFrom, setDateFrom] = useState("2026-03-14")
	const [dateTo, setDateTo] = useState(new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" }))
	const [delaySeconds, setDelaySeconds] = useState(2)

	// Modal state
	const [modalOpen, setModalOpen] = useState(false)
	const [replayStatus, setReplayStatus] = useState<ReplayStatus>("idle")
	const [orders, setOrders] = useState<ReplayOrder[]>([])
	const [currentIndex, setCurrentIndex] = useState(0)
	const [sentCount, setSentCount] = useState(0)
	const [errorCount, setErrorCount] = useState(0)
	const [currentKdi, setCurrentKdi] = useState("")
	const [lastError, setLastError] = useState("")
	const abortRef = useRef(false)
	const queryClient = useQueryClient()

	const handleOpenModal = async () => {
		if (!dateFrom || !dateTo) {
			toast.error("Informe as datas de inicio e fim")
			return
		}

		setReplayStatus("loading")
		setModalOpen(true)
		setOrders([])
		setCurrentIndex(0)
		setSentCount(0)
		setErrorCount(0)
		setCurrentKdi("")
		setLastError("")
		abortRef.current = false

		const res = await getOrdersForReplay(dateFrom, dateTo)
		if (res.success && res.data) {
			setOrders(res.data)
			setReplayStatus("ready")
		} else {
			toast.error(res.message)
			setReplayStatus("idle")
			setModalOpen(false)
		}
	}

	const handleStart = async () => {
		setReplayStatus("running")
		abortRef.current = false

		for (let i = currentIndex; i < orders.length; i++) {
			if (abortRef.current) {
				setReplayStatus("paused")
				return
			}

			const order = orders[i]
			setCurrentIndex(i)
			setCurrentKdi(String(order.kdi))

			const res = await replaySingleWebhook(String(order.kdi), order.status)
			if (res.success) {
				setSentCount((prev) => prev + 1)
			} else {
				setErrorCount((prev) => prev + 1)
				setLastError(`KDI ${order.kdi}: ${res.message}`)
			}

			// Delay entre envios
			if (i < orders.length - 1 && delaySeconds > 0) {
				await new Promise((resolve) => setTimeout(resolve, delaySeconds * 1000))
			}
		}

		setCurrentIndex(orders.length)
		setReplayStatus("done")
		queryClient.invalidateQueries({ queryKey: ["webhook-logs"] })
	}

	const handlePause = () => {
		abortRef.current = true
	}

	const handleResume = () => {
		setCurrentIndex((prev) => prev + 1)
		handleStart()
	}

	const handleClose = () => {
		abortRef.current = true
		setModalOpen(false)
		setReplayStatus("idle")
		if (sentCount > 0) {
			queryClient.invalidateQueries({ queryKey: ["webhook-logs"] })
		}
	}

	const progress = orders.length > 0 ? Math.round(((sentCount + errorCount) / orders.length) * 100) : 0

	return (
		<>
			<div className="flex items-end gap-3 p-3 border rounded-lg bg-muted/30">
				<div className="flex flex-col gap-1">
					<Label className="text-xs">De</Label>
					<Input
						type="date"
						value={dateFrom}
						onChange={(e) => setDateFrom(e.target.value)}
						className="h-8 w-[150px] text-xs"
					/>
				</div>
				<div className="flex flex-col gap-1">
					<Label className="text-xs">Ate</Label>
					<Input
						type="date"
						value={dateTo}
						onChange={(e) => setDateTo(e.target.value)}
						className="h-8 w-[150px] text-xs"
					/>
				</div>
				<div className="flex flex-col gap-1">
					<Label className="text-xs">Intervalo (seg)</Label>
					<Input
						type="number"
						min={1}
						max={30}
						value={delaySeconds}
						onChange={(e) => setDelaySeconds(Math.max(1, Math.min(30, Number(e.target.value))))}
						className="h-8 w-[90px] text-xs"
					/>
				</div>
				<Button
					size="sm"
					className="h-8 gap-1.5"
					onClick={handleOpenModal}
				>
					<Play className="h-3.5 w-3.5" />
					Replay Webhooks
				</Button>
			</div>

			<Dialog open={modalOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
				<DialogContent className="sm:max-w-[500px]">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<AlertTriangle className="h-5 w-5 text-yellow-500" />
							Realinhamento de Webhooks
						</DialogTitle>
						<DialogDescription>
							{replayStatus === "loading" && "Buscando pedidos no periodo..."}
							{replayStatus === "ready" && `Encontrados ${orders.length} pedidos com webhook no periodo ${dateFrom} a ${dateTo}. Intervalo: ${delaySeconds}s entre cada envio.`}
							{replayStatus === "running" && "Enviando webhooks... Voce pode pausar a qualquer momento."}
							{replayStatus === "paused" && "Envio pausado. Clique em Continuar para retomar ou Fechar para encerrar."}
							{replayStatus === "done" && "Realinhamento concluido."}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						{replayStatus === "loading" && (
							<div className="flex items-center justify-center py-8">
								<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
							</div>
						)}

						{replayStatus !== "loading" && replayStatus !== "idle" && (
							<>
								{/* Barra de progresso */}
								<div className="space-y-1">
									<div className="flex justify-between text-xs text-muted-foreground">
										<span>Progresso</span>
										<span>{sentCount + errorCount} de {orders.length} ({progress}%)</span>
									</div>
									<div className="h-3 bg-muted rounded-full overflow-hidden">
										<div
											className="h-full bg-primary rounded-full transition-all duration-300"
											style={{ width: `${progress}%` }}
										/>
									</div>
								</div>

								{/* Contadores */}
								<div className="grid grid-cols-3 gap-3">
									<div className="flex items-center gap-2 p-2 border rounded-md">
										<CheckCircle2 className="h-4 w-4 text-green-600" />
										<div>
											<div className="text-lg font-bold">{sentCount}</div>
											<div className="text-[10px] text-muted-foreground">Enviados</div>
										</div>
									</div>
									<div className="flex items-center gap-2 p-2 border rounded-md">
										<XCircle className="h-4 w-4 text-red-500" />
										<div>
											<div className="text-lg font-bold">{errorCount}</div>
											<div className="text-[10px] text-muted-foreground">Erros</div>
										</div>
									</div>
									<div className="flex items-center gap-2 p-2 border rounded-md">
										<Loader2 className={`h-4 w-4 ${replayStatus === "running" ? "animate-spin text-blue-500" : "text-muted-foreground"}`} />
										<div>
											<div className="text-lg font-bold">{Math.max(0, orders.length - sentCount - errorCount)}</div>
											<div className="text-[10px] text-muted-foreground">Restantes</div>
										</div>
									</div>
								</div>

								{/* KDI atual */}
								{replayStatus === "running" && currentKdi && (
									<div className="text-xs text-muted-foreground text-center">
										Processando KDI: <span className="font-mono font-bold">{currentKdi}</span>
									</div>
								)}

								{/* Ultimo erro */}
								{lastError && (
									<div className="text-xs text-red-500 bg-red-50 dark:bg-red-950/20 p-2 rounded border border-red-200 dark:border-red-800 truncate" title={lastError}>
										Ultimo erro: {lastError}
									</div>
								)}
							</>
						)}
					</div>

					<DialogFooter className="gap-2">
						{replayStatus === "ready" && (
							<>
								<Button variant="outline" onClick={handleClose}>Cancelar</Button>
								<Button onClick={handleStart} className="gap-1.5">
									<Play className="h-4 w-4" />
									Iniciar Envio ({orders.length} pedidos)
								</Button>
							</>
						)}
						{replayStatus === "running" && (
							<Button variant="destructive" onClick={handlePause} className="gap-1.5">
								<Pause className="h-4 w-4" />
								Pausar
							</Button>
						)}
						{replayStatus === "paused" && (
							<>
								<Button variant="outline" onClick={handleClose}>Fechar</Button>
								<Button onClick={handleResume} className="gap-1.5">
									<Play className="h-4 w-4" />
									Continuar ({orders.length - sentCount - errorCount} restantes)
								</Button>
							</>
						)}
						{replayStatus === "done" && (
							<Button onClick={handleClose}>Fechar</Button>
						)}
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}

export const WebhookLogsTable = () => {
	const { sorting, setSorting, columnFilters, setColumnFilters, columnVisibility, setColumnVisibility } = usePersistedTableState({
		storageKey: WEBHOOK_LOGS_TABLE_STORAGE_KEY,
		initialState: {
			sorting: [{ id: "created_at", desc: true }]
		}
	})

	const { data: response, isLoading } = useQuery({
		queryKey: ["webhook-logs"],
		queryFn: getWebhookLogs,
		refetchInterval: 30_000,
		refetchIntervalInBackground: false
	})

	const data = useMemo(() => {
		if (!response?.success || !response.data) return []
		return response.data
	}, [response])

	const table = useReactTable({
		data,
		columns,
		state: {
			sorting,
			columnVisibility,
			columnFilters
		},
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues()
	})

	const columnNameMap: { [key: string]: string } = {
		created_at: "Data/Hora",
		event_type: "Evento",
		url: "URL Webhook",
		status_code: "Status",
		success: "Resultado",
		payload: "JSON Envio",
		response_body: "JSON Resposta",
		api_key_name: "Chave API",
		actions: "Acao"
	}

	const toolbar = (
		<div className="flex flex-col gap-3">
			<ReplayPanel />
			<div className="flex items-center justify-between">
				<WebhookLogsTableToolbar table={table} />
				<DataTableViewOptions table={table} columnNameMap={columnNameMap} />
			</div>
		</div>
	)

	if (isLoading) {
		return <DataTableSkeleton columnCount={columns.length} />
	}

	return <DataTable table={table} toolbar={toolbar} />
}
