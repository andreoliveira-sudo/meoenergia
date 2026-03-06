import { redirect } from "next/navigation"

import { hasPermission } from "@/actions/auth"
import { UsersTable } from "@/components/data-tables/users/users-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const AdminUsersPage = async () => {
	const canViewUsersPage = await hasPermission("admin:users:view")
	if (!canViewUsersPage) {
		redirect("/dashboard/home")
	}

	return (
		<div className="flex flex-col gap-8">
			<div className="space-y-1.5">
				<h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Usuários</h1>
				<p className="text-muted-foreground">Adicione, edite e gerencie as permissões dos usuários do sistema.</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Todos os Usuários</CardTitle>
					<CardDescription>Visualize todos os usuários e gerencie suas permissões de acesso.</CardDescription>
				</CardHeader>
				<CardContent>
					<UsersTable />
				</CardContent>
			</Card>
		</div>
	)
}

export default AdminUsersPage
