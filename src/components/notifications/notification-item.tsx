import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Bell, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NotificationItemProps {
    notification: {
        id: string
        title: string
        content: string
        link: string | null
        read: boolean | null
        created_at: string
    }
    onRead: () => void
}

export function NotificationItem({ notification, onRead }: NotificationItemProps) {
    const isRead = notification.read

    return (
        <div
            className={cn(
                "flex flex-col gap-1 p-4 border-b hover:bg-muted/50 transition-colors relative group",
                !isRead && "bg-muted/20"
            )}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                    {!isRead && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                    <span className={cn("text-sm font-medium", !isRead && "text-foreground")}>
                        {notification.title}
                    </span>
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ptBR })}
                </span>
            </div>

            <p className="text-xs text-muted-foreground line-clamp-2">
                {notification.content}
            </p>

            <div className="flex items-center justify-between mt-2">
                {notification.link && (
                    <Link
                        href={notification.link}
                        className="text-xs text-primary hover:underline"
                        onClick={onRead}
                    >
                        Ver detalhes
                    </Link>
                )}
            </div>
        </div>
    )
}
