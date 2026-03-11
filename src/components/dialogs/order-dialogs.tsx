"use client"

import dynamic from "next/dynamic"

const CreateQuickOrderPFDialog = dynamic(
	() => import("@/components/dialogs/create-quick-order-pf-dialog")
		.then(m => ({ default: m.CreateQuickOrderPFDialog })),
	{ ssr: false }
)

const CreateQuickOrderPJDialog = dynamic(
	() => import("@/components/dialogs/create-quick-order-pj-dialog")
		.then(m => ({ default: m.CreateQuickOrderPJDialog })),
	{ ssr: false }
)

export function OrderDialogs({ type }: { type?: string }) {
	return (
		<>
			{type === "pf" && <CreateQuickOrderPFDialog />}
			{type === "pj" && <CreateQuickOrderPJDialog />}
		</>
	)
}
