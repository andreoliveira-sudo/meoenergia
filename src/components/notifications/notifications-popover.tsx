"use client"

import { useEffect, useState } from "react"
import { Bell } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { NotificationItem } from "./notification-item"
import { Badge } from "@/components/ui/badge"

type Notification = {
    id: string
    title: string
    content: string
    link: string | null
    read: boolean | null
    created_at: string
    user_id: string | null
}

export function NotificationsPopover() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [open, setOpen] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        fetchNotifications()

        // Inscrever para atualizações em tempo real
        const channel = supabase
            .channel('notifications-header')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    // O filtro user_id deve ser feito via RLS, mas o realtime pode receber tudo se não filtrado
                    // Idealmente filtraríamos aqui se tivéssemos o ID do usuário em mão sem await
                },
                (payload: any) => {
                    // Adicionar nova notificação ao topo
                    const newNotif = payload.new as Notification
                    setNotifications(prev => [newNotif, ...prev])
                    setUnreadCount(prev => prev + 1)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    async function fetchNotifications() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20)

        if (data) {
            setNotifications(data)
            setUnreadCount(data.filter(n => !n.read).length)
        }
    }

    async function markAsRead(id: string) {
        // Otimisticamente atualizar UI
        setNotifications(prev => prev.map((n: Notification) => n.id === id ? { ...n, read: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))

        await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', id)
    }

    async function markAllAsRead() {
        const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
        if (unreadIds.length === 0) return

        // Otimisticamente atualizar UI
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        setUnreadCount(0)

        await supabase
            .from('notifications')
            .update({ read: true })
            .in('id', unreadIds)
    }


    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-600 border border-background animate-pulse" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <h4 className="font-semibold text-sm">Notificações</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-auto p-1 text-muted-foreground hover:text-primary"
                            onClick={markAllAsRead}
                        >
                            Marcar lidas
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                            Nenhuma notificação
                        </div>
                    ) : (
                        notifications.map(notification => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                                onRead={() => markAsRead(notification.id)}
                            />
                        ))
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    )
}
