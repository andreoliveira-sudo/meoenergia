"use client"

import { useCallback, useRef, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
	CheckCircle,
	Clock,
	Download,
	Eye,
	FileUp,
	Loader2,
	ShieldAlert,
	Trash2,
	Upload,
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

const BUCKET_NAME = "docs_simulation"
const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "application/pdf"]
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

interface OrderDocumentsTabProps {
	orderId: string
	customerType: "pf" | "pj"
	isAdmin?: boolean
}

function getStatusBadge(status: string) {
	switch (status) {
		case "pending":
			return (
				<Badge className="bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100">
					<Clock className="size-3" />
					Pendente
				</Badge>
			)
		case "uploaded":
			return (
				<Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
					<FileUp className="size-3" />
					Enviado
				</Badge>
			)
		case "approved":
			return (
				<Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
					<CheckCircle className="size-3" />
					Aprovado
				</Badge>
			)
		case "rejected":
			return (
				<Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
					<XCircle className="size-3" />
					Rejeitado
				</Badge>
			)
		default:
			return <Badge variant="outline">{status}</Badge>
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
	const [selectedSubtype, setSelectedSubtype] = useState<string>(doc.doc_subtype || "")
	const [uploading, setUploading] = useState(false)
	const [deleting, setDeleting] = useState(false)
	const [reviewing, setReviewing] = useState(false)
	const [showRejectForm, setShowRejectForm] = useState(false)
	const [rejectionReason, setRejectionReason] = useState("")
	const fileInputRef = useRef<HTMLInputElement>(null)

	const storageKey = selectedSubtype
		? `${doc.field_name}_${selectedSubtype.replace(/\s+/g, "_")}`
		: doc.field_name

	const handleUpload = useCallback(async (file: File) => {
		if (!ACCEPTED_TYPES.includes(file.type)) {
			toast.error("Formato invalido. Aceitos: JPG, PNG, PDF.")
			return
		}
		if (file.size > MAX_FILE_SIZE) {
			toast.error("Arquivo muito grande. Maximo: 10MB.")
			return
		}
		if (doc.subtypes.length > 0 && !selectedSubtype) {
			toast.error("Selecione o subtipo do documento antes de enviar.")
			return
		}

		setUploading(true)
		try {
			const formData = new FormData()
			formData.append("orderId", orderId)
			formData.append("fieldName", doc.field_name)
			formData.append("storageKey", storageKey)
			formData.append("file", file)
			if (selectedSubtype) {
				formData.append("docSubtype", selectedSubtype)
			}

			const response = await fetch("/meo/api/v1/documents/upload", {
				method: "POST",
				body: formData,
			})

			const result = await response.json()

			if (!response.ok || !result.success) {
				toast.error(result.message || "Erro ao enviar arquivo.")
				return
			}

			toast.success("Arquivo enviado com sucesso!")
			onRefresh()
		} catch (err) {
			console.error("Erro no upload:", err)
			toast.error("Erro ao enviar arquivo.")
		} finally {
			setUploading(false)
			if (fileInputRef.current) {
				fileInputRef.current.value = ""
			}
		}
	}, [orderId, doc.field_name, doc.subtypes.length, selectedSubtype, storageKey, onRefresh])

	const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (file) {
			handleUpload(file)
		}
	}, [handleUpload])

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
			const response = await fetch(`/meo/api/v1/documents/delete`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ orderId, fieldName: doc.field_name }),
			})

			const result = await response.json()

			if (!response.ok || !result.success) {
				toast.error(result.message || "Erro ao remover arquivo.")
				return
			}

			toast.success("Arquivo removido.")
			onRefresh()
		} catch {
			toast.error("Erro ao remover arquivo.")
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
		<div className="rounded-lg border p-3 space-y-2">
			{/* Header: badge + label */}
			<div className="flex items-start justify-between gap-2">
				<div className="flex items-start gap-2 flex-1 min-w-0">
					{getStatusBadge(doc.status)}
					<div className="min-w-0">
						<p className="text-sm font-medium leading-tight">
							{doc.label}
							{doc.required && <span className="text-destructive ml-1">*</span>}
						</p>
						{doc.doc_subtype && (
							<p className="text-xs text-muted-foreground mt-0.5">
								Subtipo: {doc.doc_subtype}
							</p>
						)}
						{doc.deadline && (
							<p className="text-xs text-muted-foreground mt-0.5">
								Prazo: {new Date(doc.deadline).toLocaleDateString("pt-BR")}
							</p>
						)}
					</div>
				</div>
			</div>

			{/* Rejection reason */}
			{doc.status === "rejected" && doc.rejection_reason && (
				<div className="flex items-start gap-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md p-2">
					<ShieldAlert className="size-4 text-red-500 mt-0.5 shrink-0" />
					<p className="text-xs text-red-600 dark:text-red-400">{doc.rejection_reason}</p>
				</div>
			)}

			{/* Subtype selector */}
			{doc.subtypes.length > 0 && doc.status !== "approved" && (
				<Select value={selectedSubtype} onValueChange={setSelectedSubtype}>
					<SelectTrigger className="h-8 text-xs">
						<SelectValue placeholder="Selecione o subtipo..." />
					</SelectTrigger>
					<SelectContent>
						{doc.subtypes.map((st) => (
							<SelectItem key={st} value={st} className="text-xs">
								{st}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			)}

			{/* Actions row */}
			<div className="flex items-center gap-1.5 flex-wrap">
				{/* Upload button */}
				{doc.status !== "approved" && (
					<>
						<input
							ref={fileInputRef}
							type="file"
							accept=".jpg,.jpeg,.png,.pdf"
							className="hidden"
							onChange={handleFileChange}
						/>
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="h-7 text-xs gap-1"
							disabled={uploading}
							onClick={() => fileInputRef.current?.click()}
						>
							{uploading ? (
								<Loader2 className="size-3 animate-spin" />
							) : (
								<Upload className="size-3" />
							)}
							{doc.hasFile ? "Substituir" : "Enviar"}
						</Button>
					</>
				)}

				{/* View button */}
				{doc.hasFile && (
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="h-7 text-xs gap-1"
						onClick={handleView}
					>
						<Eye className="size-3" />
						Visualizar
					</Button>
				)}

				{/* Delete button */}
				{doc.hasFile && doc.status !== "approved" && (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="h-7 text-xs gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
						disabled={deleting}
						onClick={handleDelete}
					>
						{deleting ? (
							<Loader2 className="size-3 animate-spin" />
						) : (
							<Trash2 className="size-3" />
						)}
					</Button>
				)}

				{/* Admin review buttons */}
				{isAdmin && doc.hasFile && doc.status !== "approved" && (
					<>
						<Separator orientation="vertical" className="h-5 mx-1" />
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="h-7 text-xs gap-1 border-green-300 text-green-700 hover:bg-green-50"
							disabled={reviewing}
							onClick={() => handleReview("approved")}
						>
							{reviewing ? (
								<Loader2 className="size-3 animate-spin" />
							) : (
								<CheckCircle className="size-3" />
							)}
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
					</>
				)}
			</div>

			{/* Rejection reason form */}
			{showRejectForm && (
				<div className="space-y-2 pt-1">
					<Textarea
						placeholder="Motivo da pendencia..."
						value={rejectionReason}
						onChange={(e) => setRejectionReason(e.target.value)}
						className="text-xs min-h-[60px]"
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
							Confirmar pendencia
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="h-7 text-xs"
							onClick={() => {
								setShowRejectForm(false)
								setRejectionReason("")
							}}
						>
							Cancelar
						</Button>
					</div>
				</div>
			)}
		</div>
	)
}

export function OrderDocumentsTab({ orderId, customerType, isAdmin = false }: OrderDocumentsTabProps) {
	const queryClient = useQueryClient()

	const {
		data: docsResponse,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ["order-documents", orderId, customerType],
		queryFn: () => getOrderDocuments(orderId, customerType),
		refetchInterval: 30000, // refresh every 30s
	})

	const documents = docsResponse?.success ? docsResponse.data : []

	const handleRefresh = useCallback(() => {
		queryClient.invalidateQueries({ queryKey: ["order-documents", orderId] })
	}, [queryClient, orderId])

	if (isLoading) {
		return (
			<div className="space-y-3 p-1">
				{Array.from({ length: 4 }).map((_, i) => (
					<Skeleton key={i} className="h-24 w-full rounded-lg" />
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

	// Split into required and optional
	const requiredDocs = documents.filter((d) => d.required)
	const optionalDocs = documents.filter((d) => !d.required)

	// Stats
	const totalRequired = requiredDocs.length
	const uploadedRequired = requiredDocs.filter((d) => d.hasFile).length
	const approvedRequired = requiredDocs.filter((d) => d.status === "approved").length

	return (
		<div className="space-y-4">
			{/* Progress summary */}
			<div className="flex items-center gap-3 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
				<div className="flex items-center gap-1">
					<Upload className="size-3.5" />
					<span>Enviados: {uploadedRequired}/{totalRequired}</span>
				</div>
				<Separator orientation="vertical" className="h-4" />
				<div className="flex items-center gap-1">
					<CheckCircle className="size-3.5 text-green-500" />
					<span>Aprovados: {approvedRequired}/{totalRequired}</span>
				</div>
			</div>

			{/* Required documents */}
			{requiredDocs.length > 0 && (
				<div className="space-y-2">
					<h4 className="text-sm font-semibold text-foreground">
						Documentos obrigatorios
					</h4>
					{requiredDocs.map((doc) => (
						<DocumentRow
							key={doc.field_name}
							doc={doc}
							orderId={orderId}
							isAdmin={isAdmin}
							onRefresh={handleRefresh}
						/>
					))}
				</div>
			)}

			{/* Optional documents */}
			{optionalDocs.length > 0 && (
				<div className="space-y-2">
					<h4 className="text-sm font-semibold text-muted-foreground">
						Documentos opcionais
					</h4>
					{optionalDocs.map((doc) => (
						<DocumentRow
							key={doc.field_name}
							doc={doc}
							orderId={orderId}
							isAdmin={isAdmin}
							onRefresh={handleRefresh}
						/>
					))}
				</div>
			)}
		</div>
	)
}
