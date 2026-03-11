import Link from "next/link"
import { Package, DollarSign, Bell, Shield, Code } from "lucide-react"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const settingsCards = [
	{
		title: "Equipamentos e Tipos",
		description: "Gerencie marcas, modelos e tipos de estrutura disponíveis para simulações.",
		icon: Package,
		href: "/dashboard/admin/data",
		color: "text-blue-500"
	},
	{
		title: "Taxas e Parâmetros",
		description: "Ajuste taxas de juros e serviços que afetam os cálculos e simulações.",
		icon: DollarSign,
		href: "/dashboard/admin/settings/rates",
		color: "text-green-500"
	},
	{
		title: "Permissões",
		description: "Gerencie os usuários e suas permissões de acesso ao sistema.",
		icon: Shield,
		href: "/dashboard/admin/users",
		color: "text-amber-500"
	},
	{
		title: "Notificações",
		description: "Configure templates e regras de notificações do sistema.",
		icon: Bell,
		href: "/dashboard/admin/settings/notifications",
		color: "text-purple-500"
	},
	{
		title: "API & Integrações",
		description: "Gerencie chaves de API e integrações com sistemas externos.",
		icon: Code,
		href: "/dashboard/developer",
		color: "text-cyan-500"
	}
]

const AdminSettingsPage = () => {
	return (
		<div className="flex flex-col gap-8">
			<div className="space-y-1.5">
				<h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
				<p className="text-muted-foreground">Gerencie as configurações gerais do sistema MEO Leasing.</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{settingsCards.map((card) => (
					<Link key={card.href} href={card.href}>
						<Card className="hover:border-primary/50 hover:shadow-md transition-all duration-200 cursor-pointer h-full">
							<CardHeader>
								<div className="flex items-center gap-3 mb-1">
									<div className={`p-2 rounded-lg bg-muted ${card.color}`}>
										<card.icon className="size-5" />
									</div>
									<CardTitle className="text-lg">{card.title}</CardTitle>
								</div>
								<CardDescription>{card.description}</CardDescription>
							</CardHeader>
						</Card>
					</Link>
				))}
			</div>
		</div>
	)
}

export default AdminSettingsPage
