'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card'
import { AlertCircle, CheckCircle, XCircle, ChevronLeft, ChevronRight, MessageSquare, Mail, Bell } from 'lucide-react'
import getNotificationLogs, { NotificationLog } from '@/actions/notifications/get-notification-logs'

export default function NotificationHistoryTable() {
    const [logs, setLogs] = useState<NotificationLog[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [error, setError] = useState<string | null>(null)

    const fetchLogs = async (currentPage: number) => {
        setLoading(true)
        setError(null)
        try {
            const result = await getNotificationLogs({ page: currentPage, limit: 10 })
            if (result.success && result.data) {
                setLogs(result.data.logs)
                setTotalPages(result.data.totalPages)
                setPage(currentPage)
            } else {
                setError(result.message || 'Erro ao carregar histórico.')
            }
        } catch (err) {
            setError('Falha na comunicação com o servidor.')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLogs(1)
    }, [])

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            fetchLogs(newPage)
        }
    }

    const getChannelIcon = (channel: string) => {
        switch (channel) {
            case 'whatsapp': return <MessageSquare className="h-4 w-4 text-green-600" />
            case 'email': return <Mail className="h-4 w-4 text-blue-600" />
            case 'internal': return <Bell className="h-4 w-4 text-orange-600" />
            default: return <Bell className="h-4 w-4" />
        }
    }

    const getStatusBadge = (status: string) => {
        if (status === 'sent') {
            return <Badge variant="default" className="bg-green-600 hover:bg-green-700"><CheckCircle className="mr-1 h-3 w-3" /> Enviado</Badge>
        }
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" /> Falha</Badge>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl">Histórico de Envios</CardTitle>
                <CardDescription>Registro de todas as notificações enviadas pelo sistema.</CardDescription>
            </CardHeader>
            <CardContent>
                {error && (
                    <div className="mb-4 flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                    </div>
                )}

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[180px]">Data</TableHead>
                                <TableHead>Destinatário</TableHead>
                                <TableHead>Canal</TableHead>
                                <TableHead>Mensagem</TableHead>
                                <TableHead>Autor</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                    </TableRow>
                                ))
                            ) : logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        Nenhum registro encontrado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="font-medium text-xs text-muted-foreground">
                                            {format(new Date(log.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">{log.recipient_name}</span>
                                                <span className="text-xs text-muted-foreground">{log.recipient_phone}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 capitalize">
                                                {getChannelIcon(log.channel)}
                                                {log.channel}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="max-w-[300px] truncate text-xs text-muted-foreground" title={log.content}>
                                                {log.content}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {log.triggered_by_user ? log.triggered_by_user.name : <span className="italic text-muted-foreground">Sistema</span>}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {getStatusBadge(log.status)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination Controls */}
                <div className="mt-4 flex items-center justify-end gap-2">
                    <span className="text-xs text-muted-foreground mr-2">
                        Página {page} de {totalPages || 1}
                    </span>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page <= 1 || loading}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page >= totalPages || loading}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
