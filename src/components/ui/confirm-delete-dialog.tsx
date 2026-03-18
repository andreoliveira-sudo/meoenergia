"use client"

import { Loader2, Trash2 } from "lucide-react"
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

interface ConfirmDeleteDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	onConfirm: () => void
	title?: string
	description?: string
	loading?: boolean
}

export function ConfirmDeleteDialog({
	open,
	onOpenChange,
	onConfirm,
	title = "Confirmar Exclusão",
	description = "Tem certeza que deseja excluir este registro?",
	loading = false,
}: ConfirmDeleteDialogProps) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
							<Trash2 className="h-5 w-5 text-destructive" />
						</div>
						<AlertDialogTitle>{title}</AlertDialogTitle>
					</div>
					<AlertDialogDescription className="pt-2">
						{description}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
					<Button
						variant="destructive"
						onClick={() => {
							onConfirm()
							onOpenChange(false)
						}}
						disabled={loading}
					>
						{loading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Excluindo...
							</>
						) : (
							"Excluir"
						)}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
