"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"

function formatDate(d: Date): string {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export function DashboardDateFilter({ dateFrom, dateTo }: { dateFrom: string; dateTo: string }) {
	const router = useRouter()
	const searchParams = useSearchParams()

	const updateDates = useCallback(
		(newFrom: string, newTo: string) => {
			const params = new URLSearchParams(searchParams.toString())
			if (newFrom) params.set("dateFrom", newFrom)
			else params.delete("dateFrom")
			if (newTo) params.set("dateTo", newTo)
			else params.delete("dateTo")
			router.push(`/dashboard/admin/dashboard?${params.toString()}`)
		},
		[router, searchParams]
	)

	const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newFrom = e.target.value
		const effectiveTo = newFrom > dateTo ? newFrom : dateTo
		updateDates(newFrom, effectiveTo)
	}

	const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newTo = e.target.value
		const effectiveFrom = newTo < dateFrom ? newTo : dateFrom
		updateDates(effectiveFrom, newTo)
	}

	const today = formatDate(new Date())

	const isPreset = (days: number) => {
		if (days === 0) return dateFrom === today && dateTo === today
		const past = new Date()
		past.setDate(past.getDate() - days)
		return dateFrom === formatDate(past) && dateTo === today
	}

	const handlePreset = (days: number) => {
		if (days === 0) {
			updateDates(today, today)
			return
		}
		const past = new Date()
		past.setDate(past.getDate() - days)
		updateDates(formatDate(past), today)
	}

	const presets = [
		{ label: "Hoje", days: 0 },
		{ label: "7d", days: 7 },
		{ label: "15d", days: 15 },
		{ label: "30d", days: 30 }
	]

	return (
		<div className="flex items-center gap-1.5 text-sm whitespace-nowrap">
			<input
				type="date"
				value={dateFrom}
				onChange={handleFromChange}
				className="rounded-md border border-input bg-background px-2 py-1 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-ring w-[120px]"
			/>
			<span className="text-muted-foreground text-xs">a</span>
			<input
				type="date"
				value={dateTo}
				onChange={handleToChange}
				className="rounded-md border border-input bg-background px-2 py-1 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-ring w-[120px]"
			/>
			<div className="h-4 w-px bg-border mx-1" />
			{presets.map((p) => (
				<button
					key={p.days}
					onClick={() => handlePreset(p.days)}
					className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
						isPreset(p.days)
							? "bg-primary text-primary-foreground"
							: "bg-muted text-muted-foreground hover:bg-muted/80"
					}`}
				>
					{p.label}
				</button>
			))}
		</div>
	)
}
