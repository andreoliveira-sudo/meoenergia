"use client"

import { BadgeCheck, Bell, ChevronsUpDown, LogOut } from "lucide-react"
import Link from "next/link"

import { signOut } from "@/actions/auth"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar"

const NavUser = ({
	user
}: {
	user: {
		name: string
		email: string
	}
}) => {
	const { isMobile } = useSidebar()

	async function handleSignOut() {
		await signOut()
	}

	const getInitials = (name: string) => {
		if (!name) return "??"
		const names = name.split(" ")
		const firstInitial = names[0]?.[0] || ""
		const lastInitial = names.length > 1 ? names[names.length - 1]?.[0] : ""
		return `${firstInitial}${lastInitial}`.toUpperCase()
	}

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size="lg"
							className="data-[state=open]:bg-white/10 data-[state=open]:text-white hover:!bg-white/5 rounded-xl transition-all"
						>
							<div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-meo-blue to-meo-blue-dark text-white font-semibold text-sm shadow-lg shadow-meo-blue/20">
								{getInitials(user.name)}
							</div>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-medium text-white">{user.name}</span>
								<span className="truncate text-xs text-white/50">{user.email}</span>
							</div>
							<ChevronsUpDown className="ml-auto size-4 text-white/40" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-xl shadow-xl"
						side={isMobile ? "bottom" : "right"}
						align="end"
						sideOffset={4}
					>
						<DropdownMenuLabel className="p-0 font-normal">
							<div className="flex items-center gap-2 px-2 py-2 text-left text-sm">
								<div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-meo-blue to-meo-blue-dark text-white font-semibold text-sm">
									{getInitials(user.name)}
								</div>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-semibold">{user.name}</span>
									<span className="truncate text-xs text-muted-foreground">{user.email}</span>
								</div>
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuItem asChild className="rounded-lg">
								<Link href="/dashboard/my-account">
									<BadgeCheck className="text-meo-blue" />
									Minha conta
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem className="rounded-lg">
								<Bell className="text-meo-blue" />
								Notificações
							</DropdownMenuItem>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuItem className="text-destructive rounded-lg" onSelect={handleSignOut}>
							<LogOut className="text-destructive" />
							Sair
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	)
}

export { NavUser }
