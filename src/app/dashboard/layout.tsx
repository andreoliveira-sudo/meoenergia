import { cookies } from "next/headers"

import { getCurrentUser } from "@/actions/auth"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInsetHeader } from "@/components/sidebar-inset-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

const DashboardLayout = async ({ children }: Readonly<{ children: React.ReactNode }>) => {
	const cookieStore = await cookies()
	// Menu aberto por padrão no desktop (true se não houver cookie)
	const sidebarCookie = cookieStore.get("sidebar_state")?.value
	const defaultOpen = sidebarCookie === undefined ? true : sidebarCookie === "true"

	const userData = await getCurrentUser()

	return (
		<SidebarProvider defaultOpen={defaultOpen}>
			<AppSidebar />

			<SidebarInset className="overflow-auto bg-[#F8FAFC]">
				<SidebarInsetHeader userName={userData.name} userRole={userData.role} />
				<div className="p-4 lg:p-6 xl:p-8">
					<div className="container mx-auto flex flex-1 flex-col justify-center gap-6">{children}</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	)
}

export default DashboardLayout
