"use client"

import { ChevronDown, ChevronRight, GripVertical } from "lucide-react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { createSwapy, type Swapy } from "swapy"
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

// Utility para trabalhar com localStorage no Next.js
const useLocalStorage = (key: string, defaultValue: any) => {
	const [value, setValue] = useState(defaultValue)
	const [isLoaded, setIsLoaded] = useState(false)

	useEffect(() => {
		// Verificar se estamos no lado do cliente
		if (typeof window === "undefined") {
			setIsLoaded(true)
			return
		}

		try {
			const storedValue = localStorage.getItem(key)
			if (storedValue !== null) {
				const parsedValue = JSON.parse(storedValue)
				setValue(parsedValue)
			}
		} catch (error) {
			console.error(`Error loading ${key} from localStorage:`, error)
		} finally {
			setIsLoaded(true)
		}
	}, [key])

	const updateValue = useCallback(
		(newValue: any) => {
			// Verificar se estamos no lado do cliente
			if (typeof window === "undefined") {
				console.warn("Tentativa de salvar no localStorage no lado do servidor")
				return
			}

			try {
				setValue(newValue)
				localStorage.setItem(key, JSON.stringify(newValue))
			} catch (error) {
				console.error(`Error saving ${key} to localStorage:`, error)
			}
		},
		[key]
	)

	return [value, updateValue, isLoaded] as const
}

interface AppSidebarContentProps {
	userPermissions: string[]
	userType: "pf" | "pj" | "admin" | "seller"
}

export const AppSidebarContent = ({ userPermissions, userType }: AppSidebarContentProps) => {
	const { state: sidebarState } = useSidebar()
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const currentFullPath = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname
	const swapyRef = useRef<Swapy | null>(null)
	const containerRef = useRef<HTMLDivElement>(null)

	// Persistência da ordem no localStorage
	const [savedOrder, setSavedOrder, isOrderLoaded] = useLocalStorage("sidebar-items-order", {})

	// Reordenar itens baseado na ordem salva
	const reorderItems = useCallback(
		(sectionItems: NavItem[], sectionId: number): NavItem[] => {
			const sectionKey = `section-${sectionId}`
			const orderMap = savedOrder[sectionKey]

			if (!orderMap) return sectionItems

			// Criar array ordenado baseado no orderMap
			const orderedItems = [...sectionItems].sort((a, b) => {
				const aKey = `${sectionId}-${a.title}`
				const bKey = `${sectionId}-${b.title}`
				const aIndex = orderMap[aKey] ?? 999
				const bIndex = orderMap[bKey] ?? 999
				return aIndex - bIndex
			})

			return orderedItems
		},
		[savedOrder]
	)

	const items: NavSection[] = navItems
		.map((section): NavSection | null => {
			// Seção some se tiver permissão própria que o user não tem
			if (section.permission && !userPermissions.includes(section.permission)) {
				return null
			}

			const filteredItems: (NavItem | null)[] = section.items.map((item) => {
				// Filtro por Tipo de Usuário (PF, PJ, etc)
				if (item.allowedTypes && !item.allowedTypes.includes(userType)) {
					return null
				}

				// Filtra subItems por permissão
				const filteredSubItems = item.subItems ? item.subItems.filter((sub) => !sub.permission || userPermissions.includes(sub.permission)) : []

				const hasItemPermission = !item.permission || userPermissions.includes(item.permission)

				// Regra: o item pai aparece se o user tiver a permissão do pai OU pelo menos 1 subItem liberado
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

			// Reordenar itens baseado na ordem salva
			const orderedItems = isOrderLoaded ? reorderItems(itemsOnly, section.id) : itemsOnly

			return { ...section, items: orderedItems }
		})
		.filter((s): s is NavSection => s !== null)

	useEffect(() => {
		// Só inicializar o Swapy depois que a ordem foi carregada
		if (!isOrderLoaded || !containerRef.current) return

		swapyRef.current = createSwapy(containerRef.current, {
			animation: "dynamic"
		})

		swapyRef.current.onSwapEnd(() => {
			// Aguardar um tick para garantir que o DOM foi atualizado
			setTimeout(() => {
				if (!containerRef.current) {
					return
				}

				const newOrder: { [key: string]: { [key: string]: number } } = {}

				// Iterar por todas as seções visíveis no DOM
				const sectionElements = containerRef.current.querySelectorAll("[data-collapsible]")

				sectionElements.forEach((sectionElement) => {
					// Encontrar qual seção é esta baseado nos items dentro dela
					const firstItem = sectionElement.querySelector("[data-swapy-item]")
					if (firstItem) {
						const firstItemId = firstItem.getAttribute("data-swapy-item")
						const sectionIdMatch = firstItemId?.match(/^(\d+)-/)

						if (sectionIdMatch) {
							const sectionId = sectionIdMatch[1]
							const sectionKey = `section-${sectionId}`
							newOrder[sectionKey] = {}

							// Capturar ordem de todos os items nesta seção
							const itemElements = sectionElement.querySelectorAll("[data-swapy-item]")

							itemElements.forEach((itemElement, itemIndex) => {
								const itemId = itemElement.getAttribute("data-swapy-item")
								if (itemId) {
									newOrder[sectionKey][itemId] = itemIndex
								}
							})
						}
					}
				})
				setSavedOrder(newOrder)
			}, 50)
		})

		return () => {
			swapyRef.current?.destroy()
		}
	}, [isOrderLoaded, setSavedOrder])

	// Não renderizar até que a ordem seja carregada
	if (!isOrderLoaded) {
		return (
			<SidebarContent>
				<div className="animate-pulse p-4">Carregando...</div>
			</SidebarContent>
		)
	}

	return (
		<SidebarContent ref={containerRef}>
			{items.map((nav) => {
				if (!nav) return null

				return (
					<Collapsible key={nav.id} defaultOpen data-collapsible>
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
										{nav.items.map(({ icon: Icon, ...item }, index) => {
											const itemKey = `${nav.id}-${item.title}`
											const slotKey = `${nav.id}-${item.title}-${index}`
											const isActive = item.url.includes("?")
												? currentFullPath === item.url
												: pathname === item.url || (item.subItems && item.subItems.some((sub) => pathname.startsWith(sub.url)))

											return item.subItems && item.subItems.length > 0 ? (
												<div key={itemKey} data-swapy-slot={slotKey} className="relative group">
													<Collapsible asChild defaultOpen className="group/collapsible">
														<SidebarMenuItem data-swapy-item={itemKey} className="relative">
															<div
																className="drag-handle absolute left-0 top-1/2 transform -translate-y-1/2 z-10 w-4 h-4 flex items-center justify-center text-muted-foreground hover:text-foreground group-data-[collapsible=icon]:hidden"
																data-swapy-handle
															>
																<GripVertical className="w-3 h-3" />
															</div>

															<Link href={item.url} passHref>
																<CollapsibleTrigger asChild>
																	<SidebarMenuButton tooltip={item.title} className="pl-6" isActive={isActive}>
																		<Icon />
																		<span>{item.title}</span>
																		<ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
																	</SidebarMenuButton>
																</CollapsibleTrigger>
															</Link>

															<CollapsibleContent>
																<SidebarMenuSub>
																	{item.subItems.map((subItem, subIndex) => (
																		<SidebarMenuSubItem key={`${subItem.title}-${subIndex}`}>
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
												</div>
											) : (
												<div key={itemKey} data-swapy-slot={slotKey} className="relative group">
													<SidebarMenuItem data-swapy-item={itemKey} className="relative">
														<div
															className="drag-handle absolute left-0 top-1/2 transform -translate-y-1/2 z-10 w-4 h-4 flex items-center justify-center text-muted-foreground hover:text-foreground group-data-[collapsible=icon]:hidden"
															data-swapy-handle
														>
															<GripVertical className="w-3 h-3" />
														</div>

														<SidebarMenuButton asChild className="pl-6" isActive={isActive}>
															<Link href={item.url}>
																<Icon />
																<span>{item.title}</span>
															</Link>
														</SidebarMenuButton>
													</SidebarMenuItem>
												</div>
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
