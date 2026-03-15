import { Suspense } from "react"

import { getCurrentUser } from "@/actions/auth"
import { getDashboardStats } from "@/actions/dashboard/get-dashboard-stats"
import { DashboardDateFilter } from "@/components/dashboard/dashboard-date-filter"
import { DashboardStatsClient } from "@/components/dashboard/dashboard-stats-client"
import { getFirstAndLastName } from "@/lib/utils"

/** Retorna a data de hoje no fuso de Brasília (America/Sao_Paulo) — YYYY-MM-DD */
function getToday(): string {
	return new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" })
}

function formatDateLabel(dateFrom: string, dateTo: string): string {
	const today = getToday()
	if (dateFrom === today && dateTo === today) return "hoje"
	const fmt = (d: string) => {
		const [, m, day] = d.split("-")
		return `${day}/${m}`
	}
	if (dateFrom === dateTo) return fmt(dateFrom)
	return `${fmt(dateFrom)} a ${fmt(dateTo)}`
}

const AdminDashboardPage = async ({ searchParams }: { searchParams: Promise<{ dateFrom?: string; dateTo?: string }> }) => {
	const params = await searchParams
	const today = getToday()
	const dateFrom = params.dateFrom || today
	const dateTo = params.dateTo || today

	const [userData, initialStats] = await Promise.all([getCurrentUser(), getDashboardStats(dateFrom, dateTo)])
	const label = formatDateLabel(dateFrom, dateTo)
	const isToday = dateFrom === today && dateTo === today

	return (
		<div className="flex flex-col gap-4">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
				<div className="space-y-1.5">
					<h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
					<p className="text-muted-foreground">
						{"Bem-vindo, "}
						<span className="font-semibold text-foreground">{getFirstAndLastName(userData.name)}</span>
						{`. Acompanhe os indicadores de ${label}.`}
					</p>
				</div>
				<Suspense fallback={null}>
					<DashboardDateFilter dateFrom={dateFrom} dateTo={dateTo} />
				</Suspense>
			</div>

			{/* Stats with auto-refresh (client component) */}
			<DashboardStatsClient
				dateFrom={dateFrom}
				dateTo={dateTo}
				label={label}
				isToday={isToday}
				initialStats={initialStats}
			/>
		</div>
	)
}

export default AdminDashboardPage
