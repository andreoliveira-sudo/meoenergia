import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/lib/utils"

async function LogsTable() {
    const supabase: any = await createClient()

    // Query logs joined with api_keys (for name) and users (for email)
    // @ts-ignore
    const { data: logs, error } = await supabase
        .from("api_logs")
        .select(`
            id,
            method,
            path,
            status_code,
            created_at,
            duration_ms,
            api_keys ( name, key_prefix )
        `)
        .order("created_at", { ascending: false })
        .limit(100)

    if (error) {
        return <div className="p-4 text-red-500">Erro ao carregar logs: {error.message}</div>
    }

    if (!logs?.length) {
        return <div className="p-4 text-muted-foreground text-center">Nenhum log encontrado.</div>
    }

    // Manual join with users table
    const userIds = Array.from(new Set(logs.map((l: any) => l.user_id).filter(Boolean)))
    let userMap: Record<string, string> = {}

    if (userIds.length > 0) {
        const { data: users } = await supabase
            .from('users')
            .select('id, email, name')
            .in('id', userIds)

        if (users) {
            userMap = users.reduce((acc: any, user: any) => {
                acc[user.id] = user.email || user.name || 'Unknown'
                return acc
            }, {})
        }
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Caminho</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Chave</TableHead>
                    <TableHead>Usuário</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {logs.map((log: any) => (
                    <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap font-mono text-xs">
                            {formatDate(log.created_at)}
                        </TableCell>
                        <TableCell>
                            <Badge variant={log.method === "GET" ? "outline" : "default"}>
                                {log.method}
                            </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs max-w-[200px] truncate" title={log.path}>
                            {log.path}
                        </TableCell>
                        <TableCell>
                            <Badge
                                variant={
                                    log.status_code >= 500
                                        ? "destructive"
                                        : log.status_code >= 400
                                            ? "secondary" // was warning, but shadcn usually uses destructive for errors
                                            : "outline" // success usually green but outline is fine
                                }
                                className={
                                    log.status_code >= 200 && log.status_code < 300
                                        ? "border-green-500 text-green-500"
                                        : log.status_code >= 400 && log.status_code < 500
                                            ? "border-yellow-500 text-yellow-500"
                                            : ""
                                }
                            >
                                {log.status_code}
                            </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                            {log.duration_ms}ms
                        </TableCell>
                        <TableCell className="text-sm">
                            {log.api_keys?.name || "-"}
                            {log.api_keys?.key_prefix && (
                                <span className="ml-2 font-mono text-xs text-muted-foreground">
                                    ({log.api_keys.key_prefix}...)
                                </span>
                            )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                            {log.user_id ? (userMap[log.user_id] || log.user_id) : '-'}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

function LogsTableSkeleton() {
    return (
        <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-full" />
                </div>
            ))}
        </div>
    )
}

export default function ApiLogsPage() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Logs de Requisições</h1>
                <p className="text-muted-foreground">
                    Histórico das últimas 100 requisições feitas à API.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Tráfego Recente</CardTitle>
                    <CardDescription>
                        Monitoramento em tempo real de acessos e erros.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Suspense fallback={<LogsTableSkeleton />}>
                        <LogsTable />
                    </Suspense>
                </CardContent>
            </Card>
        </div>
    )
}
