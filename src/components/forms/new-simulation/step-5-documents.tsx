"use client"

import { ArrowLeft, Loader2, Paperclip, Send, X } from "lucide-react"
import { useFormContext } from "react-hook-form"
import { useState, useEffect, useRef, useCallback } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { documentFieldsPF, documentFieldsPJ } from "@/lib/constants"

interface Step5Props {
	onSubmit: () => void
	onBack: () => void
	createOrderFromSimulation?: boolean
	onToggleCreateOrderFromSimulation?: (value: boolean) => void
	showInputs?: boolean
	orderId?: string
}

const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "application/pdf"]
const MAX_FILE_SIZE = 10 * 1024 * 1024

function DocumentRow({
	doc,
	orderId,
}: {
	doc: { name: string; label: string; required: boolean; subtypes?: readonly string[] | string[] }
	orderId?: string
}) {
	const [selectedSubtype, setSelectedSubtype] = useState<string>(
		doc.subtypes && doc.subtypes.length === 1 ? doc.subtypes[0] : ""
	)
	const [uploading, setUploading] = useState(false)
	const [fileName, setFileName] = useState<string | null>(null)
	const [deleting, setDeleting] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const hasFile = !!fileName

	const handleUpload = useCallback(async (file: File) => {
		if (!orderId) {
			toast.error("Salve o pedido antes de anexar documentos.")
			return
		}
		if (!ACCEPTED_TYPES.includes(file.type)) {
			toast.error("Formato invalido. Aceitos: JPG, PNG, PDF.")
			return
		}
		if (file.size > MAX_FILE_SIZE) {
			toast.error("Arquivo muito grande. Maximo: 10MB.")
			return
		}

		setUploading(true)
		try {
			const storageKey = selectedSubtype
				? `${doc.name}_${selectedSubtype.replace(/\s+/g, "_")}`
				: doc.name

			const formData = new FormData()
			formData.append("orderId", orderId)
			formData.append("fieldName", doc.name)
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

			setFileName(file.name)
			toast.success("Arquivo enviado!")
		} catch {
			toast.error("Erro ao enviar arquivo.")
		} finally {
			setUploading(false)
			if (fileInputRef.current) fileInputRef.current.value = ""
		}
	}, [orderId, doc.name, selectedSubtype])

	const handleDelete = useCallback(async () => {
		if (!orderId) return
		setDeleting(true)
		try {
			const response = await fetch("/meo/api/v1/documents/delete", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ orderId, fieldName: doc.name }),
			})
			const result = await response.json()
			if (result.success) {
				setFileName(null)
				toast.success("Arquivo removido.")
			} else {
				toast.error(result.message || "Erro ao remover.")
			}
		} catch {
			toast.error("Erro ao remover.")
		} finally {
			setDeleting(false)
		}
	}, [orderId, doc.name])

	return (
		<div className="space-y-1">
			<div className="grid grid-cols-[180px_1fr_auto] items-center gap-3 py-2">
				{/* Col 1: Label + Badge */}
				<div className="space-y-1.5">
					<p className="text-xs font-medium leading-tight">
						{doc.label}
						{doc.required ? <span className="text-destructive ml-0.5">*</span> : <span className="text-muted-foreground text-[10px] ml-1 italic">(Opcional)</span>}
					</p>
					<Badge className={`text-[11px] px-3 py-1 w-full justify-center border-0 ${hasFile ? "bg-amber-500 text-white hover:bg-amber-500" : "bg-orange-500 text-white hover:bg-orange-500"}`}>
						{hasFile ? "Aguardando analise" : "Pendente"}
					</Badge>
				</div>

				{/* Col 2: Subtipo + formatos */}
				<div className="space-y-1">
					{doc.subtypes && doc.subtypes.length > 1 ? (
						<Select value={selectedSubtype} onValueChange={setSelectedSubtype}>
							<SelectTrigger className="h-8 text-xs">
								<SelectValue placeholder="Selecione..." />
							</SelectTrigger>
							<SelectContent>
								{doc.subtypes.map((st) => (
									<SelectItem key={st} value={st} className="text-xs">{st}</SelectItem>
								))}
							</SelectContent>
						</Select>
					) : doc.subtypes && doc.subtypes.length === 1 ? (
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
					{hasFile ? (
						<>
							<span className="inline-flex items-center gap-1.5 h-8 px-3 text-xs rounded-md border bg-secondary text-secondary-foreground max-w-[160px]">
								<Paperclip className="size-3.5 shrink-0" />
								<span className="truncate">{fileName}</span>
							</span>
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
			<Separator />
		</div>
	)
}

export function SimulationStep5({
	onSubmit,
	onBack,
	createOrderFromSimulation = false,
	onToggleCreateOrderFromSimulation,
	showInputs,
	orderId: orderIdProp,
}: Step5Props) {
	const form = useFormContext()

	const [mounted, setMounted] = useState(false)
	useEffect(() => {
		setMounted(true)
	}, [])

	const customerType = form.watch("type")
	const isPF = mounted ? customerType === "pf" : false
	const fields = isPF ? documentFieldsPF : documentFieldsPJ

	const orderId = orderIdProp

	return (
		<div className="space-y-6">
			<div className="space-y-1">
				<h3 className="text-lg font-medium">Passo 5: Anexo de Documentos</h3>
				{mounted && (
					<p className="text-sm text-muted-foreground">
						{isPF
							? "Documentos necessarios para Pessoa Fisica."
							: "Documentos necessarios para Pessoa Juridica."}
					</p>
				)}
			</div>

			<div className="text-center">
				<p className="text-sm font-semibold">Anexe os documentos.</p>
			</div>

			{!orderId && (
				<div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-xs text-amber-700">
					Salve o pedido primeiro (botao Salvar) para poder anexar documentos.
				</div>
			)}

			<div className="space-y-0">
				{fields.map((doc) => (
					<DocumentRow
						key={doc.name}
						doc={doc}
						orderId={orderId}
					/>
				))}
			</div>

			{showInputs && (
				<div className="pt-2">
					<div className="flex items-start space-x-3">
						<Checkbox
							id="create-order-from-simulation"
							checked={createOrderFromSimulation}
							onCheckedChange={(checked) => {
								if (onToggleCreateOrderFromSimulation)
									onToggleCreateOrderFromSimulation(!!checked)
							}}
						/>
						<div className="space-y-1">
							<label
								htmlFor="create-order-from-simulation"
								className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
							>
								Criar pedido a partir desta simulacao
							</label>
							<p className="text-sm text-muted-foreground">
								Se marcado, ao salvar a simulacao o sistema tambem criara um pedido vinculado.
							</p>
						</div>
					</div>
				</div>
			)}

			<div className="flex justify-between pt-8">
				<Button type="button" variant="outline" onClick={onBack}>
					<ArrowLeft className="mr-2 h-4 w-4" /> Voltar
				</Button>
				<Button type="button" onClick={onSubmit} disabled={form.formState.isSubmitting}>
					<Send className="mr-2 h-4 w-4" />
					Salvar
				</Button>
			</div>
		</div>
	)
}
