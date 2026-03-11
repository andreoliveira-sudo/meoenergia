"use client"

import { CalendarDays } from "lucide-react"
import { useEffect, useState } from "react"

import { HeaderBreadcrumb } from "@/components/header-breadcrumb"
import { NotificationsPopover } from "@/components/notifications/notifications-popover"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"

function getInitials(name: string | null | undefined): string {
	if (!name) return "U"
	const parts = name.trim().split(/\s+/)
	if (parts.length === 1) return (parts[0][0] ?? "U").toUpperCase()
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

interface SidebarInsetHeaderProps {
	userName?: string | null
	userRole?: string | null
}

function SidebarInsetHeader({ userName, userRole }: SidebarInsetHeaderProps) {
	const [now, setNow] = useState(new Date())

	useEffect(() => {
		const timer = setInterval(() => setNow(new Date()), 1000)
		return () => clearInterval(timer)
	}, [])

	const dateStr = now.toLocaleDateString("pt-BR", {
		weekday: "short",
		day: "2-digit",
		month: "2-digit",
		year: "numeric"
	})

	const timeStr = now.toLocaleTimeString("pt-BR", {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit"
	})

	const roleLabel = userRole === "admin"
		? "Administrador"
		: userRole === "partner"
			? "Parceiro"
			: userRole === "seller"
				? "Vendedor"
				: userRole === "staff"
					? "Colaborador"
					: "Operador"

	const displayName = userName ?? "Usuário"

	return (
		<header className="meo-header sticky top-0 z-20 flex h-(--header-height) shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
			<div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
				{/* Left side: Sidebar trigger + Breadcrumb */}
				<SidebarTrigger className="-ml-1 text-meo-gray hover:text-meo-navy hover:bg-meo-blue/5 rounded-lg transition-colors" />
				<Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4 bg-gray-200" />
				<HeaderBreadcrumb />

				{/* Right side: Date/Time + Notifications + User */}
				<div className="ml-auto flex items-center gap-3">
					{/* Date/Time Card */}
					<div className="hidden md:flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-gradient-to-r from-[#0693E3]/5 to-slate-50 shadow-sm">
						<CalendarDays className="w-4 h-4 text-[#0693E3]" />
						<div className="text-right">
							<p className="text-[11px] font-medium text-slate-500 leading-none capitalize">{dateStr}</p>
							<p className="text-sm font-bold text-[#0A1F44] tabular-nums leading-tight mt-0.5">{timeStr}</p>
						</div>
					</div>

					{/* Notifications */}
					<NotificationsPopover />

					{/* User Profile Card */}
					<div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white shadow-sm">
						<div className="hidden sm:flex flex-col items-end">
							<span className="text-sm font-semibold text-slate-700 leading-tight max-w-[140px] truncate">
								{displayName}
							</span>
							<span className="text-[11px] text-slate-400 leading-tight">
								{roleLabel}
							</span>
						</div>
						<div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0693E3] to-[#0A1F44] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
							{getInitials(userName)}
						</div>
					</div>
				</div>
			</div>
		</header>
	)
}

export { SidebarInsetHeader }
