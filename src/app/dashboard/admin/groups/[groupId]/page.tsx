import { GroupsTabs } from "@/components/group-tabs"

export default async function GroupDetailPage({ params }: { params: Promise<{ groupId: string }> }) {
	const { groupId } = await params

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold">Detalhes do Grupo</h1>

			<GroupsTabs groupId={groupId} />
		</div>
	)
}
