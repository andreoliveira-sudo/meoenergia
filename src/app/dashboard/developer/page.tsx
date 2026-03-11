"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Copy, Plus, Trash2, Key, Info, BookOpen, Pencil, Eye, EyeOff, Link as LinkIcon } from "lucide-react"
import { useForm, Controller, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { useOperationFeedback } from "@/components/feedback/operation-feedback"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from "@/components/ui/table"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "@/components/ui/select"
import {
	Form,
	FormControl,
	FormDescription,
	FormItem,
	FormLabel,
	FormMessage
} from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"

import createApiKey from "@/actions/developer/create-api-key"
import getApiKeys, { type ApiKey } from "@/actions/developer/get-api-keys"
import getPartners, { type Partner } from "@/actions/developer/get-partners"
import getSellers, { type Seller } from "@/actions/developer/get-sellers"
import revokeApiKey from "@/actions/developer/revoke-api-key"
import updateApiKey from "@/actions/developer/update-api-key"
import { formatDate } from "@/lib/utils"

// ─── Interfaces ──────────────────────────────────────────────────────

interface CreateKeyFormValues {
	name: string
	partnerId: string
	internalManagerId: string
	webhookUrl?: string
}

interface EditKeyFormValues {
	name: string
	partnerId: string
	internalManagerId: string
	webhookUrl?: string
	isActive: boolean
}

// ─── Schemas ─────────────────────────────────────────────────────────

const createKeySchema = z.object({
	name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
	partnerId: z.string().min(1, "Selecione um parceiro"),
	internalManagerId: z.string().min(1, "Selecione um gerente interno"),
	webhookUrl: z
		.string()
		.url("URL inválida")
		.optional()
		.or(z.literal(""))
}) satisfies z.ZodType<CreateKeyFormValues>

const editKeySchema = z.object({
	name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
	partnerId: z.string().min(1, "Selecione um parceiro"),
	internalManagerId: z.string().min(1, "Selecione um gerente interno"),
	webhookUrl: z
		.string()
		.url("URL inválida")
		.optional()
		.or(z.literal("")),
	isActive: z.boolean()
}) satisfies z.ZodType<EditKeyFormValues>

// ─── Page ────────────────────────────────────────────────────────────

export default function DeveloperPage() {
	const { execute } = useOperationFeedback()
	const [keys, setKeys] = useState<ApiKey[]>([])
	const [partners, setPartners] = useState<Partner[]>([])
	const [sellers, setSellers] = useState<Seller[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
	const [editingKey, setEditingKey] = useState<ApiKey | null>(null)
	const [newKey, setNewKey] = useState<string | null>(null)
	const [copied, setCopied] = useState(false)
	const [revokeTarget, setRevokeTarget] = useState<{ id: string; name: string } | null>(null)

	// Formulário de criação
	const form = useForm<CreateKeyFormValues>({
		resolver: zodResolver(createKeySchema),
		defaultValues: {
			name: "",
			partnerId: "",
			internalManagerId: "",
			webhookUrl: ""
		}
	})

	// Formulário de edição
	const editForm = useForm<EditKeyFormValues>({
		resolver: zodResolver(editKeySchema),
		defaultValues: {
			name: "",
			partnerId: "",
			internalManagerId: "",
			webhookUrl: "",
			isActive: true
		}
	})

	const fetchData = async () => {
		setIsLoading(true)
		try {
			const [keysResult, partnersResult, sellersResult] = await Promise.all([getApiKeys(), getPartners(), getSellers()])

			if (keysResult.success && keysResult.data) {
				setKeys(keysResult.data)
			}
			if (partnersResult.success && partnersResult.data) {
				setPartners(partnersResult.data)
			}
			if (sellersResult.success && sellersResult.data) {
				setSellers(sellersResult.data)
			}
		} catch {
			// Erro silencioso na carga inicial
		} finally {
			setIsLoading(false)
		}
	}

	useEffect(() => {
		fetchData()
	}, [])

	// ─── Criar Chave ─────────────────────────────────────────────────

	const onCreateSubmit: SubmitHandler<CreateKeyFormValues> = (data) => {
		execute({
			action: () =>
				createApiKey({
					name: data.name,
					partnerId: data.partnerId,
					internalManagerId: data.internalManagerId,
					webhookUrl: data.webhookUrl || undefined,
					scopes: ["orders:read", "orders:write", "data:read", "data:write", "simulations:read", "simulations:write"]
				}),
			loadingMessage: "Criando chave de API...",
			successMessage: "Chave criada com sucesso!",
			onSuccess: (result: any) => {
				if (result?.data?.key) {
					setNewKey(result.data.key)
				}
				setIsCreateDialogOpen(false)
				form.reset()
				fetchData()
			}
		})
	}

	// ─── Editar Chave ────────────────────────────────────────────────

	const onEditSubmit: SubmitHandler<EditKeyFormValues> = (data) => {
		if (!editingKey) return

		execute({
			action: () =>
				updateApiKey(editingKey.id, {
					name: data.name,
					webhook_url: data.webhookUrl || null,
					partner_id: data.partnerId,
					internal_manager_id: data.internalManagerId,
					is_active: data.isActive
				}),
			loadingMessage: "Salvando alterações...",
			successMessage: "Chave atualizada com sucesso!",
			onSuccess: () => {
				setIsEditDialogOpen(false)
				setEditingKey(null)
				fetchData()
			}
		})
	}

	// ─── Abrir edição ────────────────────────────────────────────────

	const handleEdit = (key: ApiKey) => {
		setEditingKey(key)
		editForm.reset({
			name: key.name,
			webhookUrl: key.webhook_url || "",
			partnerId: key.partner_id || "",
			internalManagerId: key.internal_manager_id || "",
			isActive: key.is_active
		})
		setIsEditDialogOpen(true)
	}

	// ─── Revogar chave (com confirmação via AlertDialog) ─────────────

	const handleRevokeConfirm = () => {
		if (!revokeTarget) return

		execute({
			action: () => revokeApiKey(revokeTarget.id),
			loadingMessage: "Revogando chave...",
			successMessage: "Chave revogada com sucesso!",
			onSuccess: () => {
				setRevokeTarget(null)
				fetchData()
			},
			onError: () => {
				setRevokeTarget(null)
			}
		})
	}

	// ─── Copiar para clipboard ───────────────────────────────────────

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text)
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}

	// ─── Estatísticas ────────────────────────────────────────────────

	const activeKeys = keys.filter((k) => k.is_active).length
	const revokedKeys = keys.filter((k) => !k.is_active).length

	return (
		<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight text-meo-navy">Desenvolvedor</h1>
					<p className="text-muted-foreground">Gerencie suas chaves de API e integrações.</p>
				</div>
				<Button variant="outline" asChild>
					<Link href="/api/v1/docs">
						<BookOpen className="mr-2 h-4 w-4" />
						Documentação da API
					</Link>
				</Button>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
				<div className="flex items-center gap-3 rounded-lg border bg-card p-3">
					<div className="rounded-md bg-blue-100 p-2">
						<Key className="h-4 w-4 text-blue-600" />
					</div>
					<div>
						<p className="text-xs text-muted-foreground">Total de Chaves</p>
						<p className="text-lg font-bold">{keys.length}</p>
					</div>
				</div>
				<div className="flex items-center gap-3 rounded-lg border bg-card p-3">
					<div className="rounded-md bg-green-100 p-2">
						<Eye className="h-4 w-4 text-green-600" />
					</div>
					<div>
						<p className="text-xs text-muted-foreground">Ativas</p>
						<p className="text-lg font-bold text-green-600">{activeKeys}</p>
					</div>
				</div>
				<div className="flex items-center gap-3 rounded-lg border bg-card p-3">
					<div className="rounded-md bg-red-100 p-2">
						<EyeOff className="h-4 w-4 text-red-600" />
					</div>
					<div>
						<p className="text-xs text-muted-foreground">Revogadas</p>
						<p className="text-lg font-bold text-red-600">{revokedKeys}</p>
					</div>
				</div>
			</div>

			{/* Card principal */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<div className="space-y-1">
						<CardTitle>Chaves de API</CardTitle>
						<CardDescription>Chaves de acesso para utilizar a API do MEO ERP Integration.</CardDescription>
					</div>
					<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
						<DialogTrigger asChild>
							<Button>
								<Plus className="mr-2 h-4 w-4" /> Nova Chave
							</Button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-[500px]">
							<DialogHeader>
								<DialogTitle>Criar Nova Chave de API</DialogTitle>
								<DialogDescription>
									Configure os detalhes da chave. Os pedidos criados via esta chave serão vinculados ao parceiro e gerente selecionados.
								</DialogDescription>
							</DialogHeader>
							<Form {...form}>
								<form onSubmit={form.handleSubmit(onCreateSubmit)} className="space-y-4">
									<Controller
										name="name"
										control={form.control}
										render={({ field }) => (
											<FormItem>
												<FormLabel>Nome da Chave</FormLabel>
												<FormControl>
													<Input placeholder="Ex: Integração ERP" {...field} />
												</FormControl>
												<FormDescription>Um nome para identificar esta integração</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<Controller
										name="webhookUrl"
										control={form.control}
										render={({ field }) => (
											<FormItem>
												<FormLabel>URL do Webhook (Opcional)</FormLabel>
												<FormControl>
													<Input placeholder="https://sua-api.com/webhook" {...field} value={field.value || ""} />
												</FormControl>
												<FormDescription>URL para receber eventos quando pedidos forem criados via API</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<Controller
										name="partnerId"
										control={form.control}
										render={({ field }) => (
											<FormItem>
												<FormLabel>Parceiro</FormLabel>
												<Select onValueChange={field.onChange} value={field.value}>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder="Selecione um parceiro" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{partners.map((partner) => (
															<SelectItem key={partner.id} value={partner.id}>
																{partner.legal_business_name}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<FormDescription>Pedidos via API serão vinculados a este parceiro</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<Controller
										name="internalManagerId"
										control={form.control}
										render={({ field }) => (
											<FormItem>
												<FormLabel>Gerente Interno</FormLabel>
												<Select onValueChange={field.onChange} value={field.value}>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder="Selecione um gerente" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{sellers.map((seller) => (
															<SelectItem key={seller.id} value={seller.id}>
																{seller.name}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<FormDescription>Responsável pelos pedidos criados via API</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<DialogFooter>
										<Button type="submit">Criar Chave</Button>
									</DialogFooter>
								</form>
							</Form>
						</DialogContent>
					</Dialog>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="flex items-center justify-center py-8">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
						</div>
					) : keys.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
							<Key className="h-12 w-12 mb-4 opacity-50" />
							<p>Você ainda não possui chaves de API.</p>
							<p className="text-sm">Crie uma chave para começar a integrar.</p>
						</div>
					) : (
						<div className="rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Nome</TableHead>
										<TableHead>Parceiro</TableHead>
										<TableHead>Gerente</TableHead>
										<TableHead>Webhook</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Criado em</TableHead>
										<TableHead>Último uso</TableHead>
										<TableHead className="text-right">Ações</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{keys.map((key) => (
										<TableRow key={key.id} className={!key.is_active ? "opacity-50" : ""}>
											<TableCell className="font-medium">
												<div className="flex flex-col">
													<span>{key.name}</span>
													<code className="text-xs text-muted-foreground mt-1">{key.key_prefix}...</code>
												</div>
											</TableCell>
											<TableCell>
												<span className="text-sm">{key.partner_name || "N/A"}</span>
											</TableCell>
											<TableCell>
												<span className="text-sm">{key.internal_manager_name || "N/A"}</span>
											</TableCell>
											<TableCell>
												{key.webhook_url ? (
													<div className="flex items-center gap-1">
														<LinkIcon className="h-3 w-3 text-green-600 flex-shrink-0" />
														<span className="text-xs truncate max-w-[120px] cursor-help" title={key.webhook_url}>
															Configurado
														</span>
													</div>
												) : (
													<span className="text-muted-foreground text-xs">Nenhum</span>
												)}
											</TableCell>
											<TableCell>
												<Badge
													variant={key.is_active ? "default" : "destructive"}
													className={key.is_active ? "bg-green-600 hover:bg-green-700" : ""}
												>
													{key.is_active ? (
														<span className="flex items-center gap-1">
															<Eye className="h-3 w-3" />
															Ativa
														</span>
													) : (
														<span className="flex items-center gap-1">
															<EyeOff className="h-3 w-3" />
															Revogada
														</span>
													)}
												</Badge>
											</TableCell>
											<TableCell className="text-sm text-muted-foreground">{formatDate(key.created_at)}</TableCell>
											<TableCell className="text-sm text-muted-foreground">
												{key.last_used_at ? formatDate(key.last_used_at) : "Nunca"}
											</TableCell>
											<TableCell className="text-right">
												<div className="flex justify-end gap-1">
													<Button variant="ghost" size="icon" onClick={() => handleEdit(key)} title="Editar Chave" className="h-8 w-8">
														<Pencil className="h-4 w-4" />
													</Button>
													{key.is_active && (
														<Button
															variant="ghost"
															size="icon"
															onClick={() => setRevokeTarget({ id: key.id, name: key.name })}
															className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
															title="Revogar Chave"
														>
															<Trash2 className="h-4 w-4" />
														</Button>
													)}
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Dialog: Nova chave criada (exibir key) */}
			<Dialog open={!!newKey} onOpenChange={(open) => !open && setNewKey(null)}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Chave Criada com Sucesso</DialogTitle>
						<DialogDescription>
							Copie sua chave de API agora. Você <strong>não poderá</strong> visualizá-la novamente.
						</DialogDescription>
					</DialogHeader>
					<div className="flex items-center space-x-2">
						<div className="grid flex-1 gap-2">
							<Label htmlFor="new-key" className="sr-only">
								Chave API
							</Label>
							<Input id="new-key" defaultValue={newKey || ""} readOnly className="font-mono text-sm bg-muted/50" />
						</div>
						<Button
							type="button"
							size="sm"
							className={`px-3 ${copied ? "bg-green-600 hover:bg-green-700" : ""}`}
							onClick={() => newKey && copyToClipboard(newKey)}
						>
							<span className="sr-only">Copiar</span>
							{copied ? <span className="text-xs">Copiado!</span> : <Copy className="h-4 w-4" />}
						</Button>
					</div>
					<div className="flex items-center space-x-2 text-sm text-muted-foreground w-full bg-yellow-50 p-3 rounded-lg border border-yellow-200">
						<Info className="h-4 w-4 text-yellow-600 flex-shrink-0" />
						<span className="text-yellow-700">Guarde-a em um local seguro. Se perder, terá que gerar uma nova.</span>
					</div>
					<DialogFooter>
						<Button type="button" variant="secondary" onClick={() => setNewKey(null)}>
							Fechar
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Dialog: Edição de chave */}
			<Dialog
				open={isEditDialogOpen}
				onOpenChange={(open) => {
					setIsEditDialogOpen(open)
					if (!open) {
						setEditingKey(null)
						editForm.reset()
					}
				}}
			>
				<DialogContent className="sm:max-w-[500px]">
					<DialogHeader>
						<DialogTitle>Editar Chave de API</DialogTitle>
						<DialogDescription>Atualize os detalhes da chave de API.</DialogDescription>
					</DialogHeader>

					<Form {...editForm}>
						<form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
							<Controller
								name="name"
								control={editForm.control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>Nome da Chave</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<Controller
								name="webhookUrl"
								control={editForm.control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>URL do Webhook</FormLabel>
										<FormControl>
											<Input placeholder="https://sua-api.com/webhook" {...field} value={field.value || ""} />
										</FormControl>
										<FormDescription>Deixe vazio para remover webhook</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<Controller
								name="partnerId"
								control={editForm.control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>Parceiro</FormLabel>
										<Select onValueChange={field.onChange} value={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Selecione um parceiro" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{partners.map((partner) => (
													<SelectItem key={partner.id} value={partner.id}>
														{partner.legal_business_name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							<Controller
								name="internalManagerId"
								control={editForm.control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>Gerente Interno</FormLabel>
										<Select onValueChange={field.onChange} value={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Selecione um gerente" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{sellers.map((seller) => (
													<SelectItem key={seller.id} value={seller.id}>
														{seller.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							<Controller
								name="isActive"
								control={editForm.control}
								render={({ field }) => (
									<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
										<div className="space-y-0.5">
											<FormLabel className="text-base">Status da Chave</FormLabel>
											<FormDescription>
												{field.value ? "Chave ativa e funcionando" : "Chave desativada - requisições serão rejeitadas"}
											</FormDescription>
										</div>
										<FormControl>
											<Switch checked={field.value} onCheckedChange={field.onChange} />
										</FormControl>
									</FormItem>
								)}
							/>

							<DialogFooter>
								<Button type="submit">Salvar Alterações</Button>
							</DialogFooter>
						</form>
					</Form>
				</DialogContent>
			</Dialog>

			{/* AlertDialog: Confirmação de revogação */}
			<AlertDialog open={!!revokeTarget} onOpenChange={(open) => !open && setRevokeTarget(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Revogar chave de API?</AlertDialogTitle>
						<AlertDialogDescription>
							Tem certeza que deseja revogar a chave <strong>&quot;{revokeTarget?.name}&quot;</strong>? Esta ação não pode ser desfeita e
							qualquer integração usando esta chave irá parar de funcionar imediatamente.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleRevokeConfirm}>
							Sim, revogar
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}
