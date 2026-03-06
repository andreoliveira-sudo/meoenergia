import { Suspense } from 'react'
import getNotificationTemplates from '@/actions/settings/get-templates'
import TemplateList from '@/components/admin/notifications/template-list'
import NotificationHistoryTable from '@/components/admin/notifications/notification-history-table'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

export default async function NotificationSettingsPage() {
    const result = await getNotificationTemplates()
    const { data: templates, success, message } = result as { success: true; data: any; message: string } | { success: false; data?: undefined; message: string }

    if (!success || !templates) {
        return (
            <div className="p-4">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>
                        {message || 'Não foi possível carregar os templates.'}
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight">Notificações</h1>
                <p className="text-muted-foreground">
                    Gerencie os modelos de mensagens enviadas automaticamente via WhatsApp.
                </p>
            </div>

            <Suspense fallback={<TemplateListSkeleton />}>
                <TemplateList initialTemplates={templates} />
            </Suspense>

            <div className="mt-8">
                <NotificationHistoryTable />
            </div>
        </div>
    )
}

function TemplateListSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col gap-3 rounded-xl border p-4 shadow-sm">
                    <div className="flex justify-between">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-5 w-16" />
                    </div>
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-9 w-full" />
                </div>
            ))}
        </div>
    )
}
