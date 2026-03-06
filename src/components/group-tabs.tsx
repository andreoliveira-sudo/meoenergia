"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MembersTable } from "./data-tables/groups/members-table"
import { RulesTable } from "./data-tables/groups/rules-table"
import { CreateMemberDialog } from "./dialogs/create-member-dialog"
import { CreateRuleDialog } from "./dialogs/create-rule-dialog"

const GroupsTabs = ({ groupId }: { groupId: string }) => {
	return (
		<Tabs defaultValue="members" className="w-full max-w-4xl mx-auto">
			<TabsList className="grid grid-cols-2 w-full max-w-4xl">
				<TabsTrigger value="members">Membros</TabsTrigger>
				<TabsTrigger value="rules">Regras</TabsTrigger>
			</TabsList>

			<TabsContent value="members" className="pt-6">
				<div className="w-full flex justify-end mb-6">
					<CreateMemberDialog groupId={groupId} />
				</div>

				<MembersTable groupId={groupId} />
			</TabsContent>

			<TabsContent value="rules" className="pt-6">
				<div className="w-full flex justify-end mb-6">
					<CreateRuleDialog groupId={groupId} />
				</div>

				<RulesTable groupId={groupId} />
			</TabsContent>
		</Tabs>
	)
}

export { GroupsTabs }
