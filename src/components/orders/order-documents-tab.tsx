"use client"

import { useCallback, useRef, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
	CheckCircle,
	Clock,
	Eye,
	FileUp,
	Loader2,
	Paperclip,
	ShieldAlert,
	Upload,
	X,
	XCircle,
} from "lucide-react"

import getOrderDocuments, { type OrderDocumentView } from "@/actions/orders/get-order-documents"
import reviewDocument from "@/actions/orders/review-document"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "application/pdf"]
const MAX_FILE_SIZE = 10 * 1024 * 1024

interface OrderDocumentsTabProps {
	orderId: string
	customerType: "pf" | "pj"
	isAdmin?: boolean
	deadline?: string | null
}

function StatusBadge({ status }: { status: string }) {
	switch (status) {
		case "pending":
			return <Badge className="bg-orange-500 text-white hover:bg-orange-500 border-0 text-[11px] px-3 py-1 w-full justify-center">Pendente</Badge>
		case "uploaded":
			return <Badge className="bg-amber-500 text-white hover:bg-amber-500 border-0 text-[11px] px-3 py-1 w-full justify-center">Aguardando analise</Badge>
		case "approved":
			return <Badge className="bg-green-600 text-white hover:bg-green-600 border-0 text-[11px] px-3 py-1 w-full justify-center">Aprovado</Badge>
		case "rejected":
			return <Badge className="bg-red-500 text-white hover:bg-red-500 border-0 text-[11px] px-3 py-1 w-full justify-center">Pendente</Badge>
		default:
			return <Badge variant="outline" className="text-[11px] px-3 py-1 w-full justify-center">{status}</Badge>
	}
}

function DocumentRow({
	doc,
	orderId,
	isAdmin,
	onRefresh,
}: {
	doc: OrderDocumentView
	orderId: string
	isAdmin: boolean
	onRefresh: () => void
}) {
	const [selectedSubtype, setSelectedSubtype] = useState<string>(doc.doc_subtype || (doc.subtypes.length === 1 ? doc.subtypes[0] : ""))
	const [uploading, setUploading] = useState(false)
	const [deleting, setDeleting] = useState(false)
	const [reviewing, setReviewing] = useState(false)
	const [showRejectForm, setShowRejectForm] = useState(false)
	const [rejectionReason, setRejectionReason] = useState("")
	const fileInputRef = useRef<HTMLInputElement>(null)

	const handleUpload = useCallback(async (file: File) => {
		if (!ACCEPTED_TYPES.includes(file.type)) {
			toast.error("Formato invalido. Aceitos: JPG, PNG, PDF.")
			return
		}
		if (file.size > MAX_FILE_SIZE) {
			toast.error("Arquivo muito grande. Maximo: 10MB.")
			return
		}
		if (doc.subtypes.length > 1 && !selectedSubtype) {
			toast.error("Selecione o subtipo do documento antes de enviar.")
			return
		}

		setUploading(true)
		try {
			const storageKey = selectedSubtype
				? `${doc.field_name}_${selectedSubtype.replace(/\s+/g, "_")}`
				: doc.field_name

			const formData = new FormData()
			formData.append("orderId", orderId)
			formData.append("fieldName", doc.field_name)
			formData.append("storageKey", storageKey)
			formData.append("file", file)
			if (selectedSubtype) formData.append("docSubtype", selectedSubtype)

			const response = await fetch("/meo/api/v1/documents/upload", {
				method: "POST",
				body: formData,
			})
			const result = await response.json()

			if (!response.ok || !result.success) {
				toast.error(result.message || "Erro ao enviar arquivo.")
				return
			}

			toast.success("Arquivo enviado!")
			onRefresh()
		} catch {
			toast.error("Erro ao enviar arquivo.")
		} finally {
			setUploading(false)
			if (fileInputRef.current) fileInputRef.current.value = ""
		}
	}, [orderId, doc.field_name, doc.subtypes, selectedSubtype, onRefresh])

	const handleView = useCallback(async () => {
		try {
			const response = await fetch(`/meo/api/v1/documents/view?orderId=${orderId}&fieldName=${doc.field_name}`)
			const result = await response.json()
			if (result.success && result.url) {
				window.open(result.url, "_blank")
			} else {
				toast.error(result.message || "Erro ao abrir documento.")
			}
		} catch {
			toast.error("Erro ao abrir documento.")
		}
	}, [orderId, doc.field_name])

	const handleDelete = useCallback(async () => {
		setDeleting(true)
		try {
			const response = await fetch("/meo/api/v1/documents/delete", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ orderId, fieldName: doc.field_name }),
			})
			const result = await response.json()
			if (!response.ok || !result.success) {
				toast.error(result.message || "Erro ao remover.")
				return
			}
			toast.success("Arquivo removido.")
			onRefresh()
		} catch {
			toast.error("Erro ao remover.")
		} finally {
			setDeleting(false)
		}
	}, [orderId, doc.field_name, onRefresh])

	const handleReview = useCallback(async (status: "approved" | "rejected") => {
		if (status === "rejected" && !showRejectForm) {
			setShowRejectForm(true)
			return
		}
		if (status === "rejected" && !rejectionReason.trim()) {
			toast.error("Informe o motivo da pendencia.")
			return
		}
		setReviewing(true)
		try {
			const result = await reviewDocument({
				orderId,
				fieldName: doc.field_name,
				status,
				rejectionReason: status === "rejected" ? rejectionReason.trim() : undefined,
			})
			if (result.success) {
				toast.success(result.message)
				setShowRejectForm(false)
				setRejectionReason("")
				onRefresh()
			} else {
				toast.error(result.message)
			}
		} catch {
			toast.error("Erro ao revisar documento.")
		} finally {
			setReviewing(false)
		}
	}, [orderId, doc.field_name, showRejectForm, rejectionReason, onRefresh])

	return (
		<div className="space-y-1">
			{/* Main row: 3 columns */}
			<div className="grid grid-cols-[180px_1fr_auto] items-center gap-3 py-2">
				{/* Col 1: Label + Badge */}
				<div className="space-y-1.5">
					<p className="text-xs font-medium leading-tight">
						{doc.label}
						{doc.required ? <span className="text-destructive ml-0.5">*</span> : <span className="text-muted-foreground text-[10px] ml-1 italic">(Opcional)</span>}
					</p>
					<StatusBadge status={doc.status} />
				</div>

				{/* Col 2: Subtipo dropdown + formato */}
				<div className="space-y-1">
					{doc.subtypes.length > 1 ? (
						<Select value={selectedSubtype} onValueChange={setSelectedSubtype} disabled={doc.status === "approved"}>
							<SelectTrigger className="h-8 text-xs">
								<SelectValue placeholder="Selecione..." />
							</SelectTrigger>
							<SelectContent>
								{doc.subtypes.map((st) => (
									<SelectItem key={st} value={st} className="text-xs">{st}</SelectItem>
								))}
							</SelectContent>
						</Select>
					) : doc.subtypes.length === 1 ? (
						<div className="h-8 flex items-center border rounded-md px-3">
							<span className="text-xs text-muted-foreground">{doc.subtypes[0]}</span>
						</div>
					) : (
						<div className="h-8" />
					)}
					<p className="text-[10px] text-muted-foreground">Formatos aceitos: .jpg, .jpeg, .png e .pdf</p>
				</div>

				{/* Col 3: Action button */}
				<div className="flex items-center gap-1">
					{doc.hasFile && doc.status !== "pending" ? (
						<>
							<Button
								type="button"
								size="sm"
								variant="secondary"
								className="h-8 text-xs gap-1.5"
								onClick={handleView}
							>
								<Eye className="size-3.5" />
								Visualizar
							</Button>
							{doc.status !== "approved" && (
								<Button
									type="button"
									size="icon"
									variant="ghost"
									className="h-8 w-8 text-muted-foreground hover:text-destructive"
									disabled={deleting}
									onClick={handleDelete}
								>
									{deleting ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
								</Button>
							)}
						</>
					) : (
						<>
							<input
								ref={fileInputRef}
								type="file"
								accept=".jpg,.jpeg,.png,.pdf"
								className="hidden"
								onChange={(e) => {
									const file = e.target.files?.[0]
									if (file) handleUpload(file)
								}}
							/>
							<Button
								type="button"
								size="sm"
								className="h-8 text-xs gap-1.5 bg-blue-500 hover:bg-blue-600 text-white"
								disabled={uploading}
								onClick={() => fileInputRef.current?.click()}
							>
								{uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Paperclip className="size-3.5" />}
								Anexar arquivo
							</Button>
						</>
					)}
				</div>
			</div>

			{/* Rejection reason display */}
			{doc.status === "rejected" && doc.rejection_reason && (
				<p className="text-xs text-red-600 pl-1 pb-1">
					Documento pendente, reenviar novo: {doc.rejection_reason}
				</p>
			)}

			{/* Admin review buttons */}
			{isAdmin && doc.hasFile && doc.status === "uploaded" && (
				<div className="flex items-center gap-2 pl-1 pb-1">
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="h-7 text-xs gap-1 border-green-300 text-green-700 hover:bg-green-50"
						disabled={reviewing}
						onClick={() => handleReview("approved")}
					>
						{reviewing ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle className="size-3" />}
						Aprovar
					</Button>
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="h-7 text-xs gap-1 border-red-300 text-red-700 hover:bg-red-50"
						disabled={reviewing}
						onClick={() => handleReview("rejected")}
					>
						<XCircle className="size-3" />
						Pendencia
					</Button>
				</div>
			)}

			{/* Rejection reason form */}
			{showRejectForm && (
				<div className="space-y-2 pl-1 pb-2">
					<Textarea
						placeholder="Motivo da pendencia..."
						value={rejectionReason}
						onChange={(e) => setRejectionReason(e.target.value)}
						className="text-xs min-h-[50px]"
					/>
					<div className="flex gap-2">
						<Button
							type="button"
							variant="destructive"
							size="sm"
							className="h-7 text-xs"
							disabled={reviewing || !rejectionReason.trim()}
							onClick={() => handleReview("rejected")}
						>
							{reviewing && <Loader2 className="size-3 animate-spin mr-1" />}
							Confirmar
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="h-7 text-xs"
							onClick={() => { setShowRejectForm(false); setRejectionReason("") }}
						>
							Cancelar
						</Button>
					</div>
				</div>
			)}

			<Separator />
		</div>
	)
}

export function OrderDocumentsTab({ orderId, customerType, isAdmin = false, deadline }: OrderDocumentsTabProps) {
	const queryClient = useQueryClient()
	const [submitting, setSubmitting] = useState(false)

	const {
		data: docsResponse,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ["order-documents", orderId, customerType],
		queryFn: () => getOrderDocuments(orderId, customerType),
		refetchInterval: 30000,
	})

	const documents = docsResponse?.success ? docsResponse.data : []

	const handleRefresh = useCallback(() => {
		queryClient.invalidateQueries({ queryKey: ["order-documents", orderId] })
	}, [queryClient, orderId])

	const handleSubmitForAnalysis = useCallback(async () => {
		setSubmitting(true)
		try {
			const { updateOrderWorkflowStatus } = await import("@/actions/orders/update-order-workflow-status")
			const result = await updateOrderWorkflowStatus({ orderId, orderStatus: "docs_analysis" })
			if (result.success) {
				toast.success("Documentos submetidos para analise!")
				handleRefresh()
			} else {
				toast.error(result.message)
			}
		} catch {
			toast.error("Erro ao submeter documentos.")
		} finally {
			setSubmitting(false)
		}
	}, [orderId, handleRefresh])

	// --- Early returns (DEPOIS de todos os hooks) ---

	if (isLoading) {
		return (
			<div className="space-y-3">
				{Array.from({ length: 4 }).map((_, i) => (
					<Skeleton key={i} className="h-16 w-full rounded-lg" />
				))}
			</div>
		)
	}

	if (isError || !docsResponse?.success) {
		return (
			<div className="text-center py-8 text-muted-foreground">
				<ShieldAlert className="mx-auto h-8 w-8 mb-2 opacity-50" />
				<p>Erro ao carregar documentos.</p>
				<Button variant="outline" size="sm" className="mt-2" onClick={handleRefresh}>
					Tentar novamente
				</Button>
			</div>
		)
	}

	if (documents.length === 0) {
		return (
			<div className="text-center py-8 text-muted-foreground">
				<FileUp className="mx-auto h-8 w-8 mb-2 opacity-50" />
				<p>Nenhum documento cadastrado para este pedido.</p>
			</div>
		)
	}

	const requiredDocs = documents.filter((d) => d.required)
	const optionalDocs = documents.filter((d) => !d.required)
	const totalRequired = requiredDocs.length
	const uploadedRequired = requiredDocs.filter((d) => d.hasFile).length
	const allRequiredUploaded = uploadedRequired === totalRequired && totalRequired > 0

	return (
		<div className="space-y-4">
			{/* Header + Prazo */}
			<div className="text-center space-y-1">
				<h3 className="text-sm font-semibold">Anexe os documentos.</h3>
				{deadline && (() => {
					const now = new Date()
					const dl = new Date(deadline)
					const diffMs = dl.getTime() - now.getTime()
					const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
					const diffHours = Math.ceil(diffMs / (1000 * 60 * 60))
					const isExpired = diffMs <= 0
					const isUrgent = diffHours <= 24
					const isWarning = diffDays <= 5
					return (
						<p className={`text-xs font-medium ${isExpired ? "text-red-600" : isUrgent ? "text-red-500" : isWarning ? "text-yellow-600" : "text-muted-foreground"}`}>
							{isExpired
								? `Prazo vencido em ${dl.toLocaleDateString("pt-BR")}`
								: diffHours <= 24
									? `Prazo: ${diffHours}h restantes`
									: `Prazo: ${diffDays} dias restantes (${dl.toLocaleDateString("pt-BR")})`
							}
						</p>
					)
				})()}
			</div>

			{/* Progress */}
			<div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
				<div className="flex items-center gap-1">
					<Upload className="size-3.5" />
					Enviados: {uploadedRequired}/{totalRequired}
				</div>
				<div className="flex items-center gap-1">
					<CheckCircle className="size-3.5 text-green-500" />
					Aprovados: {requiredDocs.filter((d) => d.status === "approved").length}/{totalRequired}
				</div>
			</div>

			{/* Required docs */}
			{requiredDocs.map((doc) => (
				<DocumentRow key={doc.field_name} doc={doc} orderId={orderId} isAdmin={isAdmin} onRefresh={handleRefresh} />
			))}

			{/* Optional docs */}
			{optionalDocs.length > 0 && (
				<>
					{optionalDocs.map((doc) => (
						<DocumentRow key={doc.field_name} doc={doc} orderId={orderId} isAdmin={isAdmin} onRefresh={handleRefresh} />
					))}
				</>
			)}

			{/* Submit button */}
			{allRequiredUploaded && (
				<div className="pt-2">
					<Button
						className="w-full bg-green-600 hover:bg-green-700 text-white"
						size="sm"
						disabled={submitting}
						onClick={handleSubmitForAnalysis}
					>
						{submitting ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
						Submeter para analise
					</Button>
				</div>
			)}
		</div>
	)
}
