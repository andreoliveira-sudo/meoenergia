"use client"

import { useState, useTransition, useEffect } from "react"
import Link from "next/link"
import { Copy, Eye, Plus, Trash2, Key, Info, BookOpen } from "lucide-react"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"

import createApiKey from "@/actions/developer/create-api-key"
import getApiKeys, { type ApiKey } from "@/actions/developer/get-api-keys"
import revokeApiKey from "@/actions/developer/revoke-api-key"
import { formatDate } from "@/lib/utils"

const createKeySchema = z.object({
    name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
})

type CreateKeyFormValues = z.infer<typeof createKeySchema>

export default function DeveloperPage() {
    const [keys, setKeys] = useState<ApiKey[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [newKey, setNewKey] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    const form = useForm<CreateKeyFormValues>({
        resolver: zodResolver(createKeySchema),
        defaultValues: {
            name: "",
        },
    })

    const fetchKeys = async () => {
        setIsLoading(true)
        const result = await getApiKeys()
        if (result.success && result.data) {
            setKeys(result.data)
        } else {
            toast.error(result.message || "Erro ao carregar chaves")
        }
        setIsLoading(false)
    }

    useEffect(() => {
        fetchKeys()
    }, [])

    const onSubmit = (data: CreateKeyFormValues) => {
        startTransition(async () => {
            const result = await createApiKey({
                name: data.name,
                scopes: ['orders:read'], // Default scope
            })
            if (result.success && result.data) {
                setNewKey(result.data.key)
                setIsCreateDialogOpen(false)
                form.reset()
                fetchKeys() // Refresh list
                toast.success("Chave criada com sucesso!")
            } else {
                toast.error(result.message || "Erro ao criar chave")
            }
        })
    }

    const handleRevoke = async (id: string, name: string) => {
        if (!confirm(`Tem certeza que deseja revogar a chave "${name}"? Esta ação não pode ser desfeita e qualquer integração usando esta chave irá parar de funcionar.`)) {
            return
        }

        const result = await revokeApiKey(id)
        if (result.success) {
            toast.success("Chave revogada com sucesso")
            fetchKeys()
        } else {
            toast.error(result.message || "Erro ao revogar chave")
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success("Copiado para a área de transferência")
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Desenvolvedor</h1>
                    <p className="text-muted-foreground">
                        Gerencie suas chaves de API e integrações.
                    </p>
                </div>
                <Button variant="outline" asChild>
                    <Link href="/dashboard/developer/docs">
                        <BookOpen className="mr-2 h-4 w-4" />
                        Documentação da API
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="space-y-1">
                        <CardTitle>Chaves de API</CardTitle>
                        <CardDescription>
                            Chaves de acesso para utilizar a API do MEO ERP Integration.
                        </CardDescription>
                    </div>
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Nova Chave
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Criar Nova Chave de API</DialogTitle>
                                <DialogDescription>
                                    Dê um nome para identificar esta chave (ex: "Integração Zapier", "Website").
                                </DialogDescription>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nome da Chave</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ex: Integração ERP" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <DialogFooter>
                                        <Button type="submit" disabled={isPending}>
                                            {isPending ? "Criando..." : "Criar Chave"}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    {!isLoading && keys.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                            <Key className="h-12 w-12 mb-4 opacity-50" />
                            <p>Você ainda não possui chaves de API.</p>
                            <p className="text-sm">Crie uma chave para começar a integrar.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Prefixo da Chave</TableHead>
                                    <TableHead>Criado em</TableHead>
                                    <TableHead>Último uso</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {keys.map((key) => (
                                    <TableRow key={key.id}>
                                        <TableCell className="font-medium">{key.name}</TableCell>
                                        <TableCell>
                                            <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
                                                {key.key_prefix}...
                                            </code>
                                        </TableCell>
                                        <TableCell>{formatDate(key.created_at)}</TableCell>
                                        <TableCell>
                                            {key.last_used_at ? formatDate(key.last_used_at) : "Nunca usada"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleRevoke(key.id, key.name)}
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                title="Revogar Chave"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Secret Key Display Dialog */}
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
                            <Label htmlFor="link" className="sr-only">
                                Chave API
                            </Label>
                            <Input
                                id="link"
                                defaultValue={newKey || ""}
                                readOnly
                                className="font-mono text-sm bg-muted/50"
                            />
                        </div>
                        <Button type="button" size="sm" className="px-3" onClick={() => newKey && copyToClipboard(newKey)}>
                            <span className="sr-only">Copiar</span>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                    <DialogFooter className="sm:justify-start">
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground w-full bg-yellow-50 dark:bg-yellow-900/10 p-2 rounded border border-yellow-200 dark:border-yellow-800">
                            <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-500 flex-shrink-0" />
                            <span className="text-yellow-700 dark:text-yellow-400">Guarde-a em um local seguro. Se perder, terá que gerar uma nova.</span>
                        </div>
                    </DialogFooter>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => setNewKey(null)}>
                            Fechar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
