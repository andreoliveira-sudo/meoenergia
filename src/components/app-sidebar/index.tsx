import Image from "next/image"
import { getCurrentUser, getUserPermissions } from "@/actions/auth"
import { NavUser } from "@/components/app-sidebar/nav-footer"
import { Separator } from "@/components/ui/separator"
import { Sidebar, SidebarFooter, SidebarHeader } from "@/components/ui/sidebar"
import { createClient } from "@/lib/supabase/server"
import { AppSidebarContent } from "./app-sidebar-wrapper"
import newLogoImg from "../../../public/new-logo.png"

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
			<SidebarHeader>
				<Image alt="MEO Leasing" src={newLogoImg} width={150} height={100} className="mx-auto" />
			</SidebarHeader>
			<Separator className="data-[orientation=horizontal]:h-0.5" />
			<AppSidebarContent userPermissions={[...userPermissions]} userType={userType} />
			<SidebarFooter>
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
