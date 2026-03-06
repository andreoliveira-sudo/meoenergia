export const dynamic = "force-dynamic"

import Link from "next/link"
import { getAllGroups } from "@/actions/groups"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const GroupPage = async () => {
	const groups = await getAllGroups()

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div className="text-center md:text-left">
					<h1 className="text-3xl font-bold tracking-tight text-foreground">Gerenciamento de Grupos</h1>
					<p className="text-muted-foreground">Adicione, edite e gerencie todos os Grupos do sistema.</p>
				</div>

				<Button asChild>
					<Link href={"/dashboard/admin/groups/new"}>Criar novo grupo</Link>
				</Button>
			</div>

			<div className="@container">
				<div className="grid grid-cols-1 @sm:grid-cols-2 @lg:grid-cols-3 gap-6">
					{groups?.map((group) => (
						<Card key={group.id}>
							<Link href={`/dashboard/admin/groups/${group.id}`}>
								<CardHeader>
									<CardTitle className="text-center">{group.name}</CardTitle>
									<CardDescription>{group.description}</CardDescription>
								</CardHeader>

								<CardContent className="text-sm">
									{group.members_count} membros • {group.rules_count} regras
								</CardContent>
							</Link>
						</Card>
					))}
				</div>
			</div>
		</div>
	)
}

export default GroupPage
