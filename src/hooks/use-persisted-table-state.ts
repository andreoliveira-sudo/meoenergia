"use client"

import { type ColumnFiltersState, type SortingState, type VisibilityState, type Updater } from "@tanstack/react-table"
import { useEffect, useRef, useState } from "react"

interface PersistedTableState {
	sorting: SortingState
	columnFilters: ColumnFiltersState
	columnVisibility: VisibilityState
}

const IGNORED_FILTER_COLUMNS = ["customer_type", "customers_type"]

function applyUpdater<T>(updater: Updater<T>, current: T): T {
	return typeof updater === "function" ? (updater as (old: T) => T)(current) : updater
}

export function usePersistedTableState<TData>({
	storageKey,
	initialState
}: {
	storageKey: string
	initialState: Partial<PersistedTableState>
}) {
	const [sorting, setSortingRaw] = useState<SortingState>(initialState.sorting || [])
	const [columnFilters, setColumnFiltersRaw] = useState<ColumnFiltersState>(initialState.columnFilters || [])
	const [columnVisibility, setColumnVisibilityRaw] = useState<VisibilityState>(initialState.columnVisibility || {})
	const [isLoaded, setIsLoaded] = useState(false)
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	const setSorting = (updater: Updater<SortingState>) =>
		setSortingRaw((current) => applyUpdater(updater, current))

	const setColumnFilters = (updater: Updater<ColumnFiltersState>) =>
		setColumnFiltersRaw((current) => applyUpdater(updater, current))

	const setColumnVisibility = (updater: Updater<VisibilityState>) =>
		setColumnVisibilityRaw((current) => applyUpdater(updater, current))

	// One-time load from localStorage on mount
	useEffect(() => {
		if (typeof window === "undefined") return

		const saved = window.localStorage.getItem(storageKey)
		if (saved) {
			try {
				const state: PersistedTableState = JSON.parse(saved)
				if (state.sorting) setSortingRaw(state.sorting)
				if (state.columnFilters) {
					const cleanFilters = state.columnFilters.filter(
						(f) => !IGNORED_FILTER_COLUMNS.includes(f.id)
					)
					setColumnFiltersRaw(cleanFilters)
				}
				if (state.columnVisibility) {
					setColumnVisibilityRaw((prev) => ({
						...prev,
						...state.columnVisibility
					}))
				}
			} catch (error) {
				console.error("Failed to parse table state:", error)
				window.localStorage.removeItem(storageKey)
			}
		}
		setIsLoaded(true)
	}, [storageKey])

	// Sync to localStorage com debounce — evita travar a cada keystroke
	useEffect(() => {
		if (!isLoaded) return

		if (debounceRef.current) clearTimeout(debounceRef.current)

		debounceRef.current = setTimeout(() => {
			const stateToSave: PersistedTableState = {
				sorting,
				columnFilters,
				columnVisibility
			}
			window.localStorage.setItem(storageKey, JSON.stringify(stateToSave))
		}, 500)

		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current)
		}
	}, [sorting, columnFilters, columnVisibility, storageKey, isLoaded])

	return {
		sorting,
		setSorting,
		columnFilters,
		setColumnFilters,
		columnVisibility,
		setColumnVisibility
	}
}
