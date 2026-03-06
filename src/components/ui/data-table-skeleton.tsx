/** biome-ignore-all lint/suspicious/noArrayIndexKey: <> */
"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface DataTableSkeletonProps {
	columnCount: number
	rowCount?: number
}

const DataTableSkeleton = ({ columnCount, rowCount = 10 }: DataTableSkeletonProps) => {
	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div className="flex flex-1 items-center gap-2">
					<Skeleton className="h-8 w-[250px]" />
					<Skeleton className="h-8 w-[120px]" />
					<Skeleton className="h-8 w-[100px]" />
				</div>
				<Skeleton className="h-8 w-[100px]" />
			</div>
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							{[...Array(columnCount)].map((_, i) => (
								<TableHead key={i}>
									<Skeleton className="h-5 w-full" />
								</TableHead>
							))}
						</TableRow>
					</TableHeader>
					<TableBody>
						{[...Array(rowCount)].map((_, i) => (
							<TableRow key={i}>
								{[...Array(columnCount)].map((_, j) => (
									<TableCell key={j}>
										<Skeleton className="h-5 w-full" />
									</TableCell>
								))}
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
			<div className="flex flex-col items-center justify-between gap-4 md:flex-row">
				<Skeleton className="h-8 w-40" />
				<div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 md:justify-end lg:gap-x-8">
					<Skeleton className="h-8 w-32" />
					<Skeleton className="h-8 w-24" />
					<div className="flex items-center space-x-2">
						<Skeleton className="size-8" />
						<Skeleton className="size-8" />
						<Skeleton className="size-8" />
						<Skeleton className="size-8" />
					</div>
				</div>
			</div>
		</div>
	)
}

export { DataTableSkeleton }
