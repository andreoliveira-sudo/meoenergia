import type { LucideIcon } from "lucide-react"
import { Activity, Bell, Briefcase, Building, Calculator, Code, FileText, Handshake, Home, LayoutList, Package, Settings, User, Users } from "lucide-react"

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
	permission?: string // Permissão necessária para ver este item
	allowedTypes?: ("pf" | "pj" | "admin" | "seller")[]
	subItems?: SubNavItem[]
	newTab?: boolean
}

interface NavSection {
	id: number
	title: string
	permission?: string
	items: NavItem[]
}

const navItems: NavSection[] = [
	{
		id: 0,
		title: "Operações",
		items: [
			{ title: "Home", url: "/dashboard/home", icon: Home },
			{
				title: "Vendedores",
				url: "/dashboard/sellers",
				icon: Briefcase,
				permission: "admin:settings:manage", // Permissão base para ver o menu
				allowedTypes: ["pj", "admin", "seller"]
			},
			{
				title: "Parceiros",
				url: "/dashboard/partners",
				icon: Handshake,
				permission: "admin:settings:manage",
				allowedTypes: ["pj", "admin", "seller"]
			},
			{
				title: "Clientes",
				url: "/dashboard/customers",
				icon: Building,
				permission: "simulations:view"
			},
			{
				title: "Simulador Livre",
				url: "/simulacao",
				icon: Calculator,
				permission: "simulations:view",
				newTab: true,
			},
			{
				title: "Notificações",
				url: "/dashboard/notifications",
				icon: Bell
			},
			{
				title: "Pessoa Jurídica",
				url: "/dashboard/orders?type=pj",
				icon: FileText,
				permission: "orders:view"
			},
			{
				title: "Pessoa Física",
				url: "/dashboard/orders?type=pf",
				icon: User,
				permission: "orders:view"
			},
			{
				title: "Desenvolvedor",
				url: "/dashboard/developer",
				icon: Code,
				permission: "admin:settings:manage"
			}
		]
	},
	{
		id: 1,
		title: "Admin",
		permission: "admin:dashboard:view",
		items: [
			{ title: "Admin Dashboard", url: "/dashboard/admin", icon: Home, permission: "admin:dashboard:view" },
			{ title: "Gerenciar Dados", url: "/dashboard/admin/data", icon: Package, permission: "admin:data:manage" },
			{
				title: "Configurações",
				url: "/dashboard/admin/settings",
				icon: Settings,
				permission: "admin:settings:manage",
				subItems: [
					{ title: "Geral", url: "/dashboard/admin/settings" },
					{ title: "Notificações", url: "/dashboard/admin/settings/notifications" }
				]
			},
			{ title: "Usuários", url: "/dashboard/admin/users", icon: User, permission: "admin:users:view" },
			{ title: "Grupos", url: "/dashboard/admin/groups", icon: Users, permission: "admin:users:view" }
		]
	}
]

export { navItems }
export type { NavSection, NavItem, SubNavItem }
