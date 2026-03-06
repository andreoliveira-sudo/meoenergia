"use client"

import { SlashIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Fragment } from "react"

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { useIsMobile } from "@/hooks/use-mobile" // ajuste se o caminho for outro

const breadcrumbMap: Record<string, { href: string; label: string }[]> = {
	"/dashboard/admin": [{ href: "/dashboard/admin", label: "Admin Dashboard" }],
	"/dashboard/admin/data": [
		{ href: "/dashboard/admin", label: "Admin Dashboard" },
		{ href: "/dashboard/admin/data", label: "Gerenciar Dados" }
	],
	"/dashboard/admin/settings": [
		{ href: "/dashboard/admin", label: "Admin Dashboard" },
		{ href: "/dashboard/admin/settings", label: "Configurações" }
	],
	"/dashboard/admin/users": [
		{ href: "/dashboard/admin", label: "Admin Dashboard" },
		{ href: "/dashboard/admin/users", label: "Usuários" }
	],
	"/dashboard/home": [{ href: "/dashboard/home", label: "Home" }],
	"/dashboard/sellers": [{ href: "/dashboard/sellers", label: "Vendedores" }],
	"/dashboard/sellers/add": [
		{ href: "/dashboard/sellers", label: "Vendedores" },
		{ href: "/dashboard/sellers/add", label: "Adicionar" }
	],
	"/dashboard/partners": [{ href: "/dashboard/partners", label: "Parceiros" }],
	"/dashboard/partners/add": [
		{ href: "/dashboard/partners", label: "Parceiros" },
		{ href: "/dashboard/partners/add", label: "Adicionar" }
	],
	"/dashboard/customers": [{ href: "/dashboard/customers", label: "Clientes" }],
	"/dashboard/reports": [{ href: "/dashboard/reports", label: "Relatórios" }],
	"/dashboard/settings": [{ href: "/dashboard/settings", label: "Configurações" }],
	"/dashboard/simulations": [{ href: "/dashboard/settings", label: "Nova Simulação" }],
	"/dashboard/orders": [{ href: "/dashboard/orders", label: "Pedidos" }]
}

const HeaderBreadcrumb = () => {
	const pathname = usePathname()
	const isMobile = useIsMobile()

	// pega o array correto (ou vazio)
	const fullCrumbs = breadcrumbMap[pathname] ?? []

	// se mobile, exibe só o último nível
	const crumbs = isMobile ? fullCrumbs.slice(-1) : fullCrumbs

	return (
		<Breadcrumb className="list-none">
			<BreadcrumbList>
				{crumbs.map((crumb, i) => (
					<Fragment key={crumb.href}>
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<Link href={crumb.href}>{crumb.label}</Link>
							</BreadcrumbLink>
						</BreadcrumbItem>
						{i < crumbs.length - 1 && (
							<BreadcrumbSeparator>
								<SlashIcon className="w-4 h-4" />
							</BreadcrumbSeparator>
						)}
					</Fragment>
				))}
			</BreadcrumbList>
		</Breadcrumb>
	)
}

export { HeaderBreadcrumb }
