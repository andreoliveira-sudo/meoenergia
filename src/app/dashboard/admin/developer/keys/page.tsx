import { Suspense } from 'react'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import getApiKeys from '@/actions/developer/get-api-keys'
import ApiKeysTable from '@/components/admin/developer/api-keys-table'
import CreateKeyDialog from '@/components/admin/developer/create-key-dialog'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function ApiKeysPage() {
    const supabase = createClient()
    const { data: { user } } = await (await supabase).auth.getUser()

    // Fetch initial keys
    const result = await getApiKeys()
    const keys = result.success ? result.data : []

    async function refreshKeys() {
        'use server'
        revalidatePath('/dashboard/admin/developer/keys')
    }

    if (!user) return <div>Acesso negado</div>

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/admin/developer">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight">Gerenciamento de Chaves</h1>
                        <p className="text-muted-foreground">
                            Crie chaves para integrar ferramentas externas (Zapier, n8n, etc).
                        </p>
                    </div>
                </div>
                <CreateKeyDialog userId={user.id} onKeyCreated={refreshKeys} />
            </div>

            <Suspense fallback={<div>Carregando chaves...</div>}>
                <ApiKeysTable initialKeys={keys || []} onUpdate={refreshKeys} />
            </Suspense>
        </div>
    )
}
