"use client"

import { cn } from "@/lib/utils"

const Table = ({ className, ...props }: React.ComponentProps<"table">) => {
	return (
		<div data-slot="table-container" className="relative w-full overflow-x-auto">
			<table data-slot="table" className={cn("w-full caption-bottom text-sm", className)} {...props} />
		</div>
	)
}

const TableHeader = ({ className, ...props }: React.ComponentProps<"thead">) => {
	return <thead data-slot="table-header" className={cn("[&_tr]:border-b [&_tr]:border-gray-100", className)} {...props} />
}

const TableBody = ({ className, ...props }: React.ComponentProps<"tbody">) => {
	return <tbody data-slot="table-body" className={cn("[&_tr:last-child]:border-0", className)} {...props} />
}

const TableFooter = ({ className, ...props }: React.ComponentProps<"tfoot">) => {
	return <tfoot data-slot="table-footer" className={cn("bg-muted/50 border-t font-medium [&>tr]:last:border-b-0", className)} {...props} />
}

const TableRow = ({ className, ...props }: React.ComponentProps<"tr">) => {
	return <tr data-slot="table-row" className={cn("hover:bg-meo-blue/[0.02] data-[state=selected]:bg-meo-blue/5 border-b border-gray-100 transition-colors", className)} {...props} />
}

const TableHead = ({ className, ...props }: React.ComponentProps<"th">) => {
	return (
		<th
			data-slot="table-head"
			className={cn(
				"text-meo-navy/70 h-11 px-3 text-left align-middle font-semibold text-xs uppercase tracking-wider whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] bg-gray-50/80",
				className
			)}
			{...props}
		/>
	)
}

const TableCell = ({ className, ...props }: React.ComponentProps<"td">) => {
	return (
		<td
			data-slot="table-cell"
			className={cn("px-3 py-2.5 align-middle text-left text-sm whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]", className)}
			{...props}
		/>
	)
}

const TableCaption = ({ className, ...props }: React.ComponentProps<"caption">) => {
	return <caption data-slot="table-caption" className={cn("text-muted-foreground mt-4 text-sm", className)} {...props} />
}

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption }
