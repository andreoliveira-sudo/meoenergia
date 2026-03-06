"use client"

import { useQueryClient } from "@tanstack/react-query"
import { Edit, Loader2, Trash2 } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { deleteBrand } from "@/actions/equipments"
import { EditBrandDialog } from "@/components/dialogs/edit-brand-dialog"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { EquipmentBrand } from "@/lib/definitions/equipments"

export const BrandsTableActions = ({ brand }: { brand: EquipmentBrand }) => {
	const [isDeletePending, startDeleteTransition] = useTransition()
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
	const queryClient = useQueryClient()

	const handleDelete = () => {
		startDeleteTransition(() => {
			toast.promise(deleteBrand(brand.id), {
				loading: `Deletando marca "${brand.name}"...`,
				success: (res) => {
					if (res.success) {
						queryClient.invalidateQueries({ queryKey: ["brands"] })
						return res.message
					}
					throw new Error(res.message)
				},
				error: (err: Error) => err.message
			})
		})
	}

	return (
		<>
			<div className="flex items-center justify-center space-x-1">
				<Tooltip>
					<TooltipTrigger asChild>
						<Button variant="ghost" size="icon" onClick={() => setIsEditDialogOpen(true)}>
							<Edit className="h-4 w-4" />
							<span className="sr-only">Editar Marca</span>
						</Button>
					</TooltipTrigger>
					<TooltipContent>Editar Marca</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<Button variant="ghost" size="icon" onClick={handleDelete} disabled={isDeletePending}>
							{isDeletePending ? <Loader2 className="h-4 w-4 animate-spin text-destructive" /> : <Trash2 className="h-4 w-4 text-destructive" />}
							<span className="sr-only">Deletar</span>
						</Button>
					</TooltipTrigger>
					<TooltipContent>Deletar Marca</TooltipContent>
				</Tooltip>
			</div>
			<EditBrandDialog brand={brand} open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} />
		</>
	)
}
