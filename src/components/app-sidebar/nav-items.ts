import type { LucideIcon } from "lucide-react"
import { Activity, BarChart3, Bell, Code, DollarSign, FileText, Home, LayoutList, List, Package, Plug, Settings, Shield, User } from "lucide-react"

interface SubNavItem {
	title: string
	url: string
	permission?: string
	allowedTypes?: ("pf" | "pj" | "admin" | "seller")[]
}

interface NavItem {
	title: string
	url: string
	icon: LucideIcon
	permission?: string
	allowedTypes?: ("pf" | "pj" | "admin" | "seller")[]
	subItems?: SubNavItem[]
	newTab?: boolean
}

interface NavSection {
	id: number
	title: string
	permission?: string
	/** Se true, renderiza os items diretamente sem header de grupo collapsible */
	standalone?: boolean
	items: NavItem[]
}

const navItems: NavSection[] = [
	{
		id: 0,
		title: "",
		permission: "admin:dashboard:view",
		standalone: true,
		items: [
			{
				title: "Dashboard",
				url: "/dashboard/admin/dashboard",
				icon: BarChart3,
				permission: "admin:dashboard:view"
			}
		]
	},
	{
		id: 1,
		title: "",
		standalone: true,
		items: [
			{ title: "Home", url: "/dashboard/home", icon: Home },
			{
				title: "Cadastros",
				url: "#",
				icon: LayoutList,
				subItems: [
					{
						title: "Vendedores",
						url: "/dashboard/sellers",
						permission: "admin:settings:manage",
						allowedTypes: ["pj", "admin", "seller"]
					},
					{
						title: "Parceiros",
						url: "/dashboard/partners",
						permission: "admin:settings:manage",
						allowedTypes: ["pj", "admin", "seller"]
					},
					{
						title: "Clientes",
						url: "/dashboard/customers",
						permission: "simulations:view"
					}
				]
			},
			{
				title: "Pedidos",
				url: "#",
				icon: FileText,
				permission: "orders:view",
				subItems: [
					{
						title: "Pessoa Jur\u00eddica",
						url: "/dashboard/orders?type=pj",
						permission: "orders:view"
					},
					{
						title: "Pessoa F\u00edsica",
						url: "/dashboard/orders?type=pf",
						permission: "orders:view"
					}
				]
			},
			{
				title: "Notifica\u00e7\u00f5es",
				url: "/dashboard/notifications",
				icon: Bell
			},
			{
				title: "Simulador Livre",
				url: "/simulacao",
				icon: Activity,
				permission: "simulations:view",
				newTab: true,
			}
		]
	},
	{
		id: 2,
		title: "Admin",
		permission: "admin:dashboard:view",
		items: [
			{ title: "Usu\u00e1rios", url: "/dashboard/admin/users", icon: User, permission: "admin:users:view" },
			{
				title: "Configura\u00e7\u00f5es",
				url: "/dashboard/admin/settings",
				icon: Settings,
				permission: "admin:settings:manage",
				subItems: [
					{ title: "Geral", url: "/dashboard/admin/settings" },
					{ title: "Equipamentos e Tipos", url: "/dashboard/admin/data", permission: "admin:data:manage" },
					{ title: "Taxas e Par\u00e2metros", url: "/dashboard/admin/settings/rates", permission: "admin:settings:manage" },
					{ title: "Permiss\u00f5es", url: "/dashboard/admin/users", permission: "admin:users:view" },
					{ title: "Notifica\u00e7\u00f5es", url: "/dashboard/admin/settings/notifications" },
					{ title: "API & Integra\u00e7\u00f5es", url: "/dashboard/developer", permission: "admin:settings:manage" },
					{ title: "Registros de API", url: "/dashboard/developer/logs", permission: "admin:settings:manage" }
				]
			}
		]
	}
]

export { navItems }
export type { NavSection, NavItem, SubNavItem }
