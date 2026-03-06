import Link from "next/link"
import { PlusCircle } from "lucide-react"

import { hasPermission } from "@/actions/auth"
import { SimulationsTable } from "@/components/data-tables/simulations/simulations-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { redirect } from "next/navigation"

const SimulationsListPage = async () => {
	const canViewSimulations = await hasPermission("simulations:view")

	if (!canViewSimulations) {
		redirect("/dashboard/home")
	}

	const canAddSimulations = await hasPermission("simulations:create")

	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Simulações</h1>
					<p className="text-muted-foreground">Visualize e gerencie todas as simulações criadas.</p>
				</div>
				{canAddSimulations && (
					<Button asChild>
						<Link href="/dashboard/simulations/add">
							<PlusCircle />
							Nova Simulação
						</Link>
					</Button>
				)}
			</div>
			<Card>
				<CardHeader>
					<CardTitle>Histórico de Simulações</CardTitle>
					<CardDescription>Lista de todas as simulações realizadas no sistema.</CardDescription>
				</CardHeader>
				<CardContent>
					<SimulationsTable />
				</CardContent>
			</Card>
		</div>
	)
}

export default SimulationsListPage
