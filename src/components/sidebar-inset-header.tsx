import { HeaderBreadcrumb } from "@/components/header-breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { NotificationsPopover } from "@/components/notifications/notifications-popover"

const SidebarInsetHeader = () => (
	<header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
		<div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
			<SidebarTrigger className="-ml-1" />
			<Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
			<HeaderBreadcrumb />
			<div className="ml-auto flex items-center gap-2">
				<NotificationsPopover />
				<span className="hidden sm:flex font-semibold text-primary-foreground">MEO Leasing</span>
			</div>
		</div>
	</header>
)

export { SidebarInsetHeader }
