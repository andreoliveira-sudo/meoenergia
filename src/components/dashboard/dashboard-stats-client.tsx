"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { DollarSign, Globe, Handshake, Monitor, RefreshCw, ShoppingCart, UserPlus, Users, UserCog } from "lucide-react"

import { getDashboardStats, type DashboardStats } from "@/actions/dashboard/get-dashboard-stats"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const REFRESH_INTERVAL = 30_000

function formatCurrency(value: number): string {
	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
		minimumFractionDigits: 2
	}).format(value)
}

function formatLastUpdate(timestamp: number): string {
	const d = new Date(timestamp)
	return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
}

interface DashboardStatsClientProps {
	dateFrom: string
	dateTo: string
	label: string
	isToday: boolean
	initialStats: DashboardStats
}

export function DashboardStatsClient({ dateFrom, dateTo, label, isToday, initialStats }: DashboardStatsClientProps) {
	const { data: stats, dataUpdatedAt, isFetching } = useQuery({
		queryKey: ["dashboard-stats", dateFrom, dateTo],
		queryFn: () => getDashboardStats(dateFrom, dateTo),
		initialData: initialStats,
		refetchInterval: REFRESH_INTERVAL,
		refetchIntervalInBackground: false
	})

	return (
		<>
			{/* Auto-refresh indicator */}
			<div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
				{isFetching ? (
					<span className="flex items-center gap-1.5">
						<RefreshCw className="size-3 animate-spin" />
						Atualizando...
					</span>
				) : (
					<span className="flex items-center gap-1.5">
						<RefreshCw className="size-3" />
						Atualizado às {formatLastUpdate(dataUpdatedAt)}
					</span>
				)}
			</div>

			{/* Stats Cards - Row 1 */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{/* Card 1: Pedidos PF */}
				<Link href={`/dashboard/orders?type=pf&dateFrom=${dateFrom}&dateTo=${dateTo}`}>
					<Card className="border-l-4 border-l-blue-500 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]">
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">Pedidos PF</CardTitle>
							<div className="p-2 rounded-lg bg-blue-50"><UserPlus className="size-5 text-blue-500" /></div>
						</CardHeader>
						<CardContent>
							<div className="text-3xl font-bold text-blue-600">{stats.ordersPF}</div>
							<p className="text-xs text-muted-foreground mt-1">{isToday ? "Pessoa Física hoje" : `Pessoa Física ${label}`}</p>
						</CardContent>
					</Card>
				</Link>

				{/* Card 2: Pedidos PJ */}
				<Link href={`/dashboard/orders?type=pj&dateFrom=${dateFrom}&dateTo=${dateTo}`}>
					<Card className="border-l-4 border-l-emerald-500 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]">
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">Pedidos PJ</CardTitle>
							<div className="p-2 rounded-lg bg-emerald-50"><Users className="size-5 text-emerald-500" /></div>
						</CardHeader>
						<CardContent>
							<div className="text-3xl font-bold text-emerald-600">{stats.ordersPJ}</div>
							<p className="text-xs text-muted-foreground mt-1">{isToday ? "Pessoa Jurídica hoje" : `Pessoa Jurídica ${label}`}</p>
						</CardContent>
					</Card>
				</Link>

				{/* Card 3: Total Vendas */}
				<Link href={`/dashboard/orders?dateFrom=${dateFrom}&dateTo=${dateTo}`}>
					<Card className="border-l-4 border-l-amber-500 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]">
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">{isToday ? "Vendas Hoje" : `Vendas ${label}`}</CardTitle>
							<div className="p-2 rounded-lg bg-amber-50"><ShoppingCart className="size-5 text-amber-500" /></div>
						</CardHeader>
						<CardContent>
							<div className="text-3xl font-bold text-amber-600">{stats.ordersToday}</div>
							<p className="text-xs text-muted-foreground mt-1">{isToday ? "pedidos criados hoje" : `pedidos ${label}`}</p>
						</CardContent>
					</Card>
				</Link>
			</div>

			{/* Stats Cards - Row 2 */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{/* Card 4: Valor Total */}
				<Link href={`/dashboard/orders?dateFrom=${dateFrom}&dateTo=${dateTo}`}>
					<Card className="border-l-4 border-l-violet-500 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]">
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">Valor Total de Cotações</CardTitle>
							<div className="p-2 rounded-lg bg-violet-50"><DollarSign className="size-5 text-violet-500" /></div>
						</CardHeader>
						<CardContent>
							<div className="text-3xl font-bold text-violet-600">{formatCurrency(stats.ordersTotalValue)}</div>
							<p className="text-xs text-muted-foreground mt-1">{isToday ? "cotações de hoje" : `cotações ${label}`}</p>
						</CardContent>
					</Card>
				</Link>

				{/* Card 5: Parceiros */}
				<Link href={`/dashboard/partners?dateFrom=${dateFrom}&dateTo=${dateTo}`}>
					<Card className="border-l-4 border-l-orange-500 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]">
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">{isToday ? "Parceiros Hoje" : `Parceiros ${label}`}</CardTitle>
							<div className="p-2 rounded-lg bg-orange-50"><Handshake className="size-5 text-orange-500" /></div>
						</CardHeader>
						<CardContent>
							<div className="text-3xl font-bold text-orange-600">{stats.newPartnersToday}</div>
							<p className="text-xs text-muted-foreground mt-1">{isToday ? "parceiros cadastrados hoje" : `parceiros ${label}`}</p>
						</CardContent>
					</Card>
				</Link>

				{/* Card 6: Vendedores */}
				<Link href={`/dashboard/sellers?dateFrom=${dateFrom}&dateTo=${dateTo}`}>
					<Card className="border-l-4 border-l-cyan-500 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]">
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">{isToday ? "Vendedores Hoje" : `Vendedores ${label}`}</CardTitle>
							<div className="p-2 rounded-lg bg-cyan-50"><UserCog className="size-5 text-cyan-500" /></div>
						</CardHeader>
						<CardContent>
							<div className="text-3xl font-bold text-cyan-600">{stats.newSellersToday}</div>
							<p className="text-xs text-muted-foreground mt-1">{isToday ? "vendedores cadastrados hoje" : `vendedores ${label}`}</p>
						</CardContent>
					</Card>
				</Link>
			</div>

			{/* Resumo geral */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">{isToday ? "Resumo do Dia" : `Resumo ${label}`}</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
						<div className="flex items-center gap-3">
							<div className="p-2.5 rounded-xl bg-green-50"><Globe className="size-5 text-green-600" /></div>
							<div>
								<p className="text-xl font-bold">{stats.ordersAPI}</p>
								<p className="text-xs text-muted-foreground">Registros Via API</p>
							</div>
						</div>
						<div className="flex items-center gap-3">
							<div className="p-2.5 rounded-xl bg-slate-50"><Monitor className="size-5 text-slate-600" /></div>
							<div>
								<p className="text-xl font-bold">{stats.ordersManual}</p>
								<p className="text-xs text-muted-foreground">Registros Manuais</p>
							</div>
						</div>
						<div className="flex items-center gap-3">
							<div className="p-2.5 rounded-xl bg-blue-50"><Users className="size-5 text-blue-600" /></div>
							<div>
								<p className="text-xl font-bold">{stats.ordersToday}</p>
								<p className="text-xs text-muted-foreground">Total pedidos</p>
							</div>
						</div>
						<div className="flex items-center gap-3">
							<div className="p-2.5 rounded-xl bg-amber-50"><ShoppingCart className="size-5 text-amber-600" /></div>
							<div>
								<p className="text-xl font-bold">{stats.ordersPF + stats.ordersPJ}</p>
								<p className="text-xs text-muted-foreground">PF: {stats.ordersPF} | PJ: {stats.ordersPJ}</p>
							</div>
						</div>
						<div className="flex items-center gap-3">
							<div className="p-2.5 rounded-xl bg-violet-50"><DollarSign className="size-5 text-violet-600" /></div>
							<div>
								<p className="text-xl font-bold">{formatCurrency(stats.ordersTotalValue)}</p>
								<p className="text-xs text-muted-foreground">Cotações</p>
							</div>
						</div>
						<div className="flex items-center gap-3">
							<div className="p-2.5 rounded-xl bg-orange-50"><Handshake className="size-5 text-orange-600" /></div>
							<div>
								<p className="text-xl font-bold">{stats.newPartnersToday}</p>
								<p className="text-xs text-muted-foreground">Parceiros</p>
							</div>
						</div>
						<div className="flex items-center gap-3">
							<div className="p-2.5 rounded-xl bg-cyan-50"><UserCog className="size-5 text-cyan-600" /></div>
							<div>
								<p className="text-xl font-bold">{stats.newSellersToday}</p>
								<p className="text-xs text-muted-foreground">Vendedores</p>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</>
	)
}
