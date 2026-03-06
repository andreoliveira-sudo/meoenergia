import { redirect } from "next/navigation"

import { hasPermission } from "@/actions/auth"
import { PartnerTable } from "@/components/data-tables/partners/partner-table"
import { AddPartnerDialog } from "@/components/dialogs/add-partner-dialog"

const PartnersPage = async () => {
	const canViewPartners = await hasPermission("partners:view")

	if (!canViewPartners) {
		redirect("/dashboard/home")
	}

	const canManagePartners = await hasPermission("partners:manage")

	return (
		<>
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div className="text-center md:text-left">
					<h1 className="text-3xl font-bold tracking-tight text-foreground">Parceiros</h1>
					<p className="text-muted-foreground">Gerencie os parceiros cadastrados no sistema.</p>
				</div>

				{canManagePartners && <AddPartnerDialog />}
			</div>
			<PartnerTable />
		</>
	)
}

export default PartnersPage
