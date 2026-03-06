import { cookies } from "next/headers"

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInsetHeader } from "@/components/sidebar-inset-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

const DashboardLayout = async ({ children }: Readonly<{ children: React.ReactNode }>) => {
	const cookieStore = await cookies()
	const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"

	return (
		<SidebarProvider defaultOpen={defaultOpen}>
			<AppSidebar />

			<SidebarInset className="overflow-auto">
				<SidebarInsetHeader />
				<div className="p-4 lg:p-8">
					<div className="container mx-auto flex flex-1 flex-col justify-center gap-8">{children}</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	)
}

export default DashboardLayout
