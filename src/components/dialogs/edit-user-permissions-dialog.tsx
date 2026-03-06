"use client"

import { Settings } from "lucide-react"
import { useState } from "react"

import { EditUserPermissionsForm } from "@/components/forms/edit-user-permissions-form"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { User } from "@/lib/definitions/users"

interface EditUserPermissionsDialogProps {
	user: User
}

export function EditUserPermissionsDialog({ user }: EditUserPermissionsDialogProps) {
	const [open, setOpen] = useState(false)

	const handleSuccess = () => {
		setOpen(false)
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<Tooltip>
				<TooltipTrigger asChild>
					<DialogTrigger asChild>
						<Button variant="ghost" size="icon">
							<Settings className="size-4" />
							<span className="sr-only">Editar Permissões</span>
						</Button>
					</DialogTrigger>
				</TooltipTrigger>
				<TooltipContent>
					<p>Editar Permissões</p>
				</TooltipContent>
			</Tooltip>
			<DialogContent className="sm:max-w-[600px] max-h-[90vh]">
				<DialogHeader>
					<DialogTitle>Editar Permissões de Usuário</DialogTitle>
					<DialogDescription>
						Ajuste as permissões para o usuário <span className="font-bold text-primary">{user.email}</span>. As alterações serão aplicadas imediatamente.
					</DialogDescription>
				</DialogHeader>
				<EditUserPermissionsForm user={user} onSuccess={handleSuccess} />
			</DialogContent>
		</Dialog>
	)
}
