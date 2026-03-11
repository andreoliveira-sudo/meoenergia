"use client"

import { Check, PlusCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface ServerFacetedFilterProps {
	title: string
	selectedValues: string[]
	onChange: (values: string[]) => void
	options: { label: string; value: string }[]
}

export const ServerFacetedFilter = ({ title, selectedValues, onChange, options }: ServerFacetedFilterProps) => {
	const selectedSet = new Set(selectedValues)

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button size="sm" className="h-8 border-dashed">
					<PlusCircle className="mr-2 h-4 w-4" />
					{title}
					{selectedSet.size > 0 && (
						<>
							<Separator orientation="vertical" className="mx-2 h-4" />
							<Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
								{selectedSet.size}
							</Badge>
							<div className="hidden space-x-1 lg:flex">
								{selectedSet.size > 2 ? (
									<Badge variant="secondary" className="rounded-sm px-1 font-normal">
										{selectedSet.size} selecionados
									</Badge>
								) : (
									options
										.filter((option) => selectedSet.has(option.value))
										.map((option) => (
											<Badge variant="secondary" key={option.value} className="rounded-sm px-1 font-normal">
												{option.label}
											</Badge>
										))
								)}
							</div>
						</>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[200px] p-0" align="start">
				<Command>
					<CommandInput placeholder={title} />
					<CommandList>
						<CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
						<CommandGroup>
							{options.map((option) => {
								const isSelected = selectedSet.has(option.value)
								return (
									<CommandItem
										key={option.value}
										onSelect={() => {
											const newSet = new Set(selectedSet)
											if (isSelected) {
												newSet.delete(option.value)
											} else {
												newSet.add(option.value)
											}
											onChange(Array.from(newSet))
										}}
									>
										<div
											className={cn(
												"mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
												isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
											)}
										>
											<Check className={cn("h-4 w-4")} />
										</div>
										<span>{option.label}</span>
									</CommandItem>
								)
							})}
						</CommandGroup>
						{selectedSet.size > 0 && (
							<>
								<CommandSeparator />
								<CommandGroup>
									<CommandItem onSelect={() => onChange([])} className="justify-center text-center">
										Limpar filtros
									</CommandItem>
								</CommandGroup>
							</>
						)}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	)
}
