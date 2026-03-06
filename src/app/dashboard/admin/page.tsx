import { DollarSign, Package, ShieldCheck, Bell, Code2 } from "lucide-react"
import Link from "next/link"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const AdminDashboardPage = () => {
	return (
		<div className="flex flex-col gap-8">
			<div className="space-y-1.5">
				<h1 className="text-3xl font-bold tracking-tight">Painel Administrativo</h1>
				<p className="text-muted-foreground">Bem-vindo! Gerencie sua aplicação de forma centralizada.</p>
			</div>
			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				<Card className="hover:border-primary/80 hover:shadow-lg transition-all">
					<Link href="/dashboard/admin/data">
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="text-sm font-medium">Gerenciar Dados</CardTitle>
							<Package className="h-5 w-5 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">Equipamentos e Tipos</div>
							<p className="text-xs text-muted-foreground">Edite tipos de estrutura, equipamentos e marcas.</p>
						</CardContent>
					</Link>
				</Card>
				<Card className="hover:border-primary/80 hover:shadow-lg transition-all">
					<Link href="/dashboard/admin/settings">
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="text-sm font-medium">Configurações</CardTitle>
							<DollarSign className="h-5 w-5 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">Taxas e Parâmetros</div>
							<p className="text-xs text-muted-foreground">Ajuste a taxa de juros e outras configurações globais.</p>
						</CardContent>
					</Link>
				</Card>
				<Card className="hover:border-primary/80 hover:shadow-lg transition-all">
					<Link href="/dashboard/admin/groups">
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="text-sm font-medium">Regras de Acesso</CardTitle>
							<ShieldCheck className="h-5 w-5 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">Grupos e Permissões</div>
							<p className="text-xs text-muted-foreground">Gerencie grupos de usuários e suas permissões.</p>
						</CardContent>
					</Link>
				</Card>
				<Card className="hover:border-primary/80 hover:shadow-lg transition-all">
					<Link href="/dashboard/admin/settings/notifications">
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="text-sm font-medium">Notificações</CardTitle>
							<Bell className="h-5 w-5 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">Templates de Mensagem</div>
							<p className="text-xs text-muted-foreground">Personalize as mensagens automáticas de WhatsApp e e-mail.</p>
						</CardContent>
					</Link>
				</Card>
				<Card className="hover:border-primary/80 hover:shadow-lg transition-all">
					<Link href="/dashboard/admin/developer">
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="text-sm font-medium">Desenvolvedor</CardTitle>
							<Code2 className="h-5 w-5 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">API & Integrações</div>
							<p className="text-xs text-muted-foreground">Gerencie chaves de acesso, webhooks e documentação.</p>
						</CardContent>
					</Link>
				</Card>
			</div>
		</div>
	)
}

export default AdminDashboardPage
