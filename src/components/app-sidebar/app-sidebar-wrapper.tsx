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
	SidebarMenuSubItem
} from "@/components/ui/sidebar"
import type { NavItem, NavSection } from "./nav-items"

interface AppSidebarContentProps {
	userPermissions: string[]
	userType: "pf" | "pj" | "admin" | "seller"
}

export const AppSidebarContent = ({ userPermissions, userType }: AppSidebarContentProps) => {
	const pathname = usePathname()
	const searchParams = useSearchParams()

	const items: NavSection[] = navItems
		.map((section): NavSection | null => {
			if (section.permission && !userPermissions.includes(section.permission)) {
				return null
			}

			const filteredItems: (NavItem | null)[] = section.items.map((item) => {
				if (item.allowedTypes && !item.allowedTypes.includes(userType)) {
					return null
				}

				const filteredSubItems = item.subItems ? item.subItems.filter((sub) => !sub.permission || userPermissions.includes(sub.permission)) : []

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

	return (
		<SidebarContent>
			{items.map((nav) => {
				if (!nav) return null

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
										{nav.items.map(({ icon: Icon, newTab, ...item }) => {
											const [itemPath, itemQuery] = item.url.split("?")
											const currentFullUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "")
											const isActive = currentFullUrl === item.url || (pathname === itemPath && !itemQuery) || pathname?.startsWith(itemPath + "/") || (item.subItems && item.subItems.some((sub) => pathname.startsWith(sub.url)))

											return item.subItems && item.subItems.length > 0 ? (
												<Collapsible key={item.title} asChild defaultOpen className="group/collapsible">
													<SidebarMenuItem>
														<Link href={item.url} passHref>
															<CollapsibleTrigger asChild>
																<SidebarMenuButton tooltip={item.title} isActive={isActive}>
																	<Icon />
																	<span>{item.title}</span>
																	<ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
																</SidebarMenuButton>
															</CollapsibleTrigger>
														</Link>

														<CollapsibleContent>
															<SidebarMenuSub>
																{item.subItems.map((subItem) => (
																	<SidebarMenuSubItem key={subItem.title}>
																		<SidebarMenuSubButton asChild>
																			<Link href={subItem.url}>
																				<span>{subItem.title}</span>
																			</Link>
																		</SidebarMenuSubButton>
																	</SidebarMenuSubItem>
																))}
															</SidebarMenuSub>
														</CollapsibleContent>
													</SidebarMenuItem>
												</Collapsible>
											) : (
												<SidebarMenuItem key={item.title}>
													<SidebarMenuButton asChild isActive={isActive}>
														<Link href={item.url} target={newTab ? "_blank" : undefined} rel={newTab ? "noopener noreferrer" : undefined}>
															<Icon />
															<span>{item.title}</span>
														</Link>
													</SidebarMenuButton>
												</SidebarMenuItem>
											)
										})}
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
