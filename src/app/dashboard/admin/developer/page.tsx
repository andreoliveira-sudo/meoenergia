import { Suspense } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Key, FileText, Activity, BarChart3, AlertCircle } from 'lucide-react'
import getApiUsageStats from '@/actions/developer/get-api-usage-stats'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default async function DeveloperDashboardPage() {
    const statsRes = await getApiUsageStats()
    const stats = statsRes.success ? statsRes.data : null

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                    <h1 className="text-3xl font-bold tracking-tight">Área do Desenvolvedor</h1>
                    <p className="text-muted-foreground">Gerencie chaves de API, webhooks e monitore o uso da plataforma.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/dashboard/admin/developer/docs">
                        <Button variant="outline">
                            <FileText className="mr-2 h-4 w-4" />
                            Documentação
                        </Button>
                    </Link>
                    <Link href="/dashboard/admin/developer/keys">
                        <Button>
                            <Key className="mr-2 h-4 w-4" />
                            Gerenciar Chaves
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Requisições (30d)</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.total_requests || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats?.total_requests ? '+100% vs mês anterior' : 'Sem dados recentes'}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Latência Média</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.avg_duration || 0}ms</div>
                        <p className="text-xs text-muted-foreground">
                            Tempo médio de resposta
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Erros (4xx/5xx)</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.errors || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            Falhas nos últimos 30 dias
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Access */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="hover:border-primary/50 hover:shadow-md transition-all">
                    <Link href="/dashboard/admin/developer/keys">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Key className="h-5 w-5" />
                                Chaves de API
                            </CardTitle>
                            <CardDescription>Crie e revogue chaves de acesso com escopos personalizados.</CardDescription>
                        </CardHeader>
                    </Link>
                </Card>
                <Card className="hover:border-primary/50 hover:shadow-md transition-all">
                    <Link href="/dashboard/admin/developer/logs">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5" />
                                Logs de Requisições
                            </CardTitle>
                            <CardDescription>Inspecione o tráfego detalhado e identifique problemas.</CardDescription>
                        </CardHeader>
                    </Link>
                </Card>
            </div>
        </div>
    )
}
