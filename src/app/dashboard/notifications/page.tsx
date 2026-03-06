"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CheckCircle, Search } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type Notification = {
    id: string
    title: string
    content: string
    link: string | null
    read: boolean | null
    created_at: string
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('')
    const supabase = createClient()

    useEffect(() => {
        fetchNotifications()
    }, [])

    async function fetchNotifications() {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(100)

        if (error) {
            toast.error("Erro ao carregar notificações")
        } else {
            setNotifications(data || [])
        }
        setLoading(false)
    }

    async function markAsRead(id: string) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
        await supabase.from('notifications').update({ read: true }).eq('id', id)
    }

    async function markAllAsRead() {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        await supabase.from('notifications').update({ read: true }).neq('read', true)
        toast.success("Todas as notificações marcadas como lidas")
    }

    const filteredNotifications = notifications.filter(n =>
        n.title.toLowerCase().includes(filter.toLowerCase()) ||
        n.content.toLowerCase().includes(filter.toLowerCase())
    )

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Notificações</h1>
                <p className="text-muted-foreground">
                    Veja todo o histórico de suas notificações e alertas do sistema.
                </p>
            </div>

            <Separator />

            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar notificações..."
                        className="pl-8"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>
                <Button variant="outline" onClick={markAllAsRead}>
                    Marcar todas como lidas
                </Button>
            </div>

            <div className="grid gap-4">
                {loading ? (
                    <div className="text-center py-10 text-muted-foreground">Carregando...</div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                        Nenhuma notificação encontrada.
                    </div>
                ) : (
                    filteredNotifications.map((notification) => (
                        <Card key={notification.id} className={cn("transition-colors", !notification.read && "bg-muted/30 border-l-4 border-l-blue-500")}>
                            <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                                <div className="flex flex-col gap-1 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className={cn("font-medium", !notification.read && "text-blue-600 dark:text-blue-400")}>
                                            {notification.title}
                                        </h3>
                                        {!notification.read && (
                                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5">Novo</Badge>
                                        )}
                                        <span className="text-xs text-muted-foreground ml-auto md:ml-2">
                                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ptBR })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{notification.content}</p>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    {notification.link && (
                                        <Button asChild variant="outline" size="sm" onClick={() => markAsRead(notification.id)}>
                                            <Link href={notification.link}>
                                                Ver Detalhes
                                            </Link>
                                        </Button>
                                    )}
                                    {!notification.read && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            title="Marcar como lida"
                                            onClick={() => markAsRead(notification.id)}
                                        >
                                            <CheckCircle className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
