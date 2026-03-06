"use client"

import { type ColumnFiltersState, type SortingState, type VisibilityState } from "@tanstack/react-table"
import { useEffect, useState } from "react"

interface PersistedTableState {
	sorting: SortingState
	columnFilters: ColumnFiltersState
	columnVisibility: VisibilityState
}

export function usePersistedTableState<TData>({ storageKey, initialState }: { storageKey: string; initialState: Partial<PersistedTableState> }) {
	// Initialize with defaults to match server-side rendering
	const [sorting, setSorting] = useState<SortingState>(initialState.sorting || [])
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(initialState.columnFilters || [])
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(initialState.columnVisibility || {})
	const [isLoaded, setIsLoaded] = useState(false)

	// One-time load from localStorage on mount
	useEffect(() => {
		if (typeof window === "undefined") return

		const saved = window.localStorage.getItem(storageKey)
		if (saved) {
			try {
				const state: PersistedTableState = JSON.parse(saved)
				if (state.sorting) setSorting(state.sorting)
				if (state.columnFilters) setColumnFilters(state.columnFilters)
				// Merge saved visibility with initial visibility to ensure new columns appear by default
				if (state.columnVisibility) {
					setColumnVisibility((prev) => ({
						...prev,
						...state.columnVisibility,
					}))
				}
			} catch (error) {
				console.error("Failed to parse table state:", error)
			}
		}
		setIsLoaded(true)
	}, [storageKey])

	// Sync changes to localStorage, ONLY after initial load is complete
	useEffect(() => {
		if (!isLoaded) return

		const stateToSave: PersistedTableState = {
			sorting,
			columnFilters,
			columnVisibility,
		}
		window.localStorage.setItem(storageKey, JSON.stringify(stateToSave))
	}, [sorting, columnFilters, columnVisibility, storageKey, isLoaded])

	// Return state - standard React Table expects these exact shapes
	return {
		sorting,
		setSorting,
		columnFilters,
		setColumnFilters,
		columnVisibility,
		setColumnVisibility,
	}
}
