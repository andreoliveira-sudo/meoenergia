"use client"

import { ChevronDown, ChevronRight } from "lucide-react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { navItems } from "@/components/app-sidebar/nav-items"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	useSidebar
} from "@/components/ui/sidebar"
import type { NavItem, NavSection } from "./nav-items"

interface AppSidebarContentProps {
	userPermissions: string[]
	userType: "pf" | "pj" | "admin" | "seller"
}

export const AppSidebarContent = ({ userPermissions, userType }: AppSidebarContentProps) => {
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const { setOpenMobile, isMobile } = useSidebar()

	const closeMobileSidebar = () => {
		if (isMobile) {
			setOpenMobile(false)
		}
	}

	const items: NavSection[] = navItems
		.map((section): NavSection | null => {
			if (section.permission && !userPermissions.includes(section.permission)) {
				return null
			}

			const filteredItems: (NavItem | null)[] = section.items.map((item) => {
				if (item.allowedTypes && !item.allowedTypes.includes(userType)) {
					return null
				}

				const filteredSubItems = item.subItems
					? item.subItems.filter((sub) => {
							if (sub.permission && !userPermissions.includes(sub.permission)) return false
							if (sub.allowedTypes && !sub.allowedTypes.includes(userType)) return false
							return true
						})
					: []

				const hasItemPermission = !item.permission || userPermissions.includes(item.permission)

				if (!hasItemPermission && filteredSubItems.length === 0) {
					return null
				}

				return {
					...item,
					subItems: filteredSubItems.length > 0 ? filteredSubItems : undefined
				}
			})

			const itemsOnly = filteredItems.filter((it): it is NavItem => it !== null)
			if (itemsOnly.length === 0) return null

			return { ...section, items: itemsOnly }
		})
		.filter((s): s is NavSection => s !== null)

	const renderMenuItems = (navItems: NavItem[]) => {
		return navItems.map(({ icon: Icon, newTab, ...item }) => {
			const [itemPath, itemQuery] = item.url.split("?")
			const currentFullUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "")
			const isActive = currentFullUrl === item.url || (pathname === itemPath && !itemQuery) || pathname?.startsWith(itemPath + "/") || (item.subItems && item.subItems.some((sub) => {
				const [subPath, subQuery] = sub.url.split("?")
				if (subQuery) return currentFullUrl === sub.url
				return pathname === subPath || pathname?.startsWith(subPath + "/")
			}))

			return item.subItems && item.subItems.length > 0 ? (
				<Collapsible key={item.title} asChild defaultOpen={isActive} className="group/collapsible">
					<SidebarMenuItem>
						{item.url && item.url !== "#" ? (
							<Link href={item.url} passHref onClick={closeMobileSidebar}>
								<CollapsibleTrigger asChild>
									<SidebarMenuButton tooltip={item.title} isActive={isActive}>
										<Icon />
										<span>{item.title}</span>
										<ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
									</SidebarMenuButton>
								</CollapsibleTrigger>
							</Link>
						) : (
							<CollapsibleTrigger asChild>
								<SidebarMenuButton tooltip={item.title} isActive={isActive}>
									<Icon />
									<span>{item.title}</span>
									<ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
								</SidebarMenuButton>
							</CollapsibleTrigger>
						)}

						<CollapsibleContent>
							<SidebarMenuSub>
								{item.subItems.map((subItem) => {
									const [subPath, subQuery] = subItem.url.split("?")
									const isSubActive = subQuery
										? currentFullUrl === subItem.url
										: pathname === subPath || pathname?.startsWith(subPath + "/")
									return (
										<SidebarMenuSubItem key={subItem.title}>
											<SidebarMenuSubButton asChild isActive={isSubActive}>
												<Link href={subItem.url} onClick={closeMobileSidebar}>
													<span>{subItem.title}</span>
												</Link>
											</SidebarMenuSubButton>
										</SidebarMenuSubItem>
									)
								})}
							</SidebarMenuSub>
						</CollapsibleContent>
					</SidebarMenuItem>
				</Collapsible>
			) : (
				<SidebarMenuItem key={item.title}>
					<SidebarMenuButton asChild isActive={isActive}>
						<Link href={item.url} target={newTab ? "_blank" : undefined} rel={newTab ? "noopener noreferrer" : undefined} onClick={closeMobileSidebar}>
							<Icon />
							<span>{item.title}</span>
						</Link>
					</SidebarMenuButton>
				</SidebarMenuItem>
			)
		})
	}

	return (
		<SidebarContent>
			{items.map((nav) => {
				if (!nav) return null

				// Standalone: renderiza items diretamente sem header de grupo
				if (nav.standalone) {
					return (
						<SidebarGroup key={nav.id} className="pb-0">
							<SidebarGroupContent>
								<SidebarMenu>
									{renderMenuItems(nav.items)}
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>
					)
				}

				// Normal: renderiza com header collapsible
				return (
					<Collapsible key={nav.id} defaultOpen>
						<SidebarGroup>
							<SidebarGroupLabel asChild>
								<CollapsibleTrigger>
									{nav.title}
									<ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
								</CollapsibleTrigger>
							</SidebarGroupLabel>

							<CollapsibleContent>
								<SidebarGroupContent>
									<SidebarMenu>
										{renderMenuItems(nav.items)}
									</SidebarMenu>
								</SidebarGroupContent>
							</CollapsibleContent>
						</SidebarGroup>
					</Collapsible>
				)
			})}
		</SidebarContent>
	)
}
