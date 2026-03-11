'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Trash2, Shield, MoreHorizontal } from 'lucide-react'

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'

import { ApiKey } from '@/actions/developer/get-api-keys'
import revokeApiKey from '@/actions/developer/revoke-api-key'
import { useOperationFeedback } from '@/components/feedback/operation-feedback'

export default function ApiKeysTable({ initialKeys, onUpdate }: { initialKeys: ApiKey[], onUpdate: () => void }) {
    const [keyToRevoke, setKeyToRevoke] = useState<string | null>(null)
    const { execute } = useOperationFeedback()

    const handleRevoke = async () => {
        if (!keyToRevoke) return
        execute({
            action: () => revokeApiKey(keyToRevoke),
            loadingMessage: 'Revogando chave...',
            successMessage: 'Chave revogada com sucesso',
            onSuccess: () => {
                onUpdate()
                setKeyToRevoke(null)
            },
            onError: () => {
                setKeyToRevoke(null)
            }
        })
    }

    if (!initialKeys.length) {
        return (
            <div className="flex h-[200px] flex-col items-center justify-center rounded-md border border-dashed bg-muted/50 text-muted-foreground">
                <Shield className="h-8 w-8 opacity-50 mb-2" />
                <p>Nenhuma chave de API encontrada.</p>
            </div>
        )
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Identificacao</TableHead>
                        <TableHead className="w-[150px]">Prefixo</TableHead>
                        <TableHead>Permissoes</TableHead>
                        <TableHead>Criado em</TableHead>
                        <TableHead>Ultimo uso</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {initialKeys.map((key) => (
                        <TableRow key={key.id} className={!key.is_active ? 'opacity-50 bg-muted/50' : ''}>
                            <TableCell className="font-medium">
                                <div className="flex flex-col">
                                    <span>{key.name}</span>
                                    <span className="text-xs text-muted-foreground">{key.user_email}</span>
                                </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                                {key.key_prefix}...
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-wrap gap-1">
                                    {key.scopes.slice(0, 3).map((scope) => (
                                        <Badge key={scope} variant="outline" className="text-[10px]">
                                            {scope}
                                        </Badge>
                                    ))}
                                    {key.scopes.length > 3 && (
                                        <Badge variant="outline" className="text-[10px]">
                                            +{key.scopes.length - 3}
                                        </Badge>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                                {format(new Date(key.created_at), "dd/MM/yy", { locale: ptBR })}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                                {key.last_used_at
                                    ? format(new Date(key.last_used_at), "dd/MM/yy HH:mm", { locale: ptBR })
                                    : 'Nunca'}
                            </TableCell>
                            <TableCell>
                                <Badge variant={key.is_active ? 'default' : 'destructive'}>
                                    {key.is_active ? 'Ativo' : 'Revogado'}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Acoes</DropdownMenuLabel>
                                        <DropdownMenuItem
                                            onClick={() => navigator.clipboard.writeText(key.id)}
                                        >
                                            Copiar ID
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            disabled={!key.is_active}
                                            className="text-destructive focus:text-destructive"
                                            onClick={() => setKeyToRevoke(key.id)}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Revogar Chave
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <AlertDialog open={!!keyToRevoke} onOpenChange={(val) => !val && setKeyToRevoke(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Voce tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acao nao pode ser desfeita. A chave deixara de funcionar imediatamente para qualquer aplicacao que a esteja utilizando.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleRevoke}
                        >
                            Sim, revogar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
