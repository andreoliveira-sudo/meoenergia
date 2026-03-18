import Image from "next/image"
import { getCurrentUser, getUserPermissions } from "@/actions/auth"
import { NavUser } from "@/components/app-sidebar/nav-footer"
import { Sidebar, SidebarFooter, SidebarHeader } from "@/components/ui/sidebar"
import { createClient } from "@/lib/supabase/server"
import { AppSidebarContent } from "./app-sidebar-wrapper"

const AppSidebar = async () => {
	const userPermissions = await getUserPermissions()
	const userData = await getCurrentUser()
	const supabase = await createClient()
	const {
		data: { user }
	} = await supabase.auth.getUser()

	const userType = (user?.user_metadata?.type as "pf" | "pj" | "admin" | "seller") ?? (userData.role as "admin" | "seller" | "partner") ?? "pf"

	return (
		<Sidebar collapsible="icon" variant="inset">
			<SidebarHeader className="p-4 pb-3">
				<div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
					<Image
						alt="MEO Energia"
						src="/logo-azul-branco.png"
						width={130}
						height={65}
						className="group-data-[collapsible=icon]:hidden drop-shadow-sm"
					/>
					<Image
						alt="MEO"
						src="/logo-azul-branco.png"
						width={32}
						height={32}
						className="hidden group-data-[collapsible=icon]:block"
					/>
				</div>
				{/* Divider gradient */}
				<div className="mt-2 h-px bg-gradient-to-r from-transparent via-meo-blue/30 to-transparent" />
			</SidebarHeader>
			<AppSidebarContent userPermissions={[...userPermissions]} userType={userType} />
			<SidebarFooter>
				<div className="h-px bg-gradient-to-r from-transparent via-meo-blue/20 to-transparent mb-1" />
				<div className="px-3 py-1 text-[10px] text-muted-foreground/60 font-mono text-center">
					Versão 180301-1407
				</div>
				<NavUser
					user={{
						name: userData.name || "Usuário",
						email: userData.email || "email@exemplo.com"
					}}
				/>
			</SidebarFooter>
		</Sidebar>
	)
}

export { AppSidebar }
