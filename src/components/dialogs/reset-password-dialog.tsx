"use client"

import { KeyRound } from "lucide-react"
import { useState } from "react"

import { adminResetPassword } from "@/actions/users"
import { useOperationFeedback } from "@/components/feedback/operation-feedback"
import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { User } from "@/lib/definitions/users"

interface ResetPasswordDialogProps {
	user: User
}

export function ResetPasswordDialog({ user }: ResetPasswordDialogProps) {
	const [open, setOpen] = useState(false)
	const { execute } = useOperationFeedback()

	const handleReset = () => {
		execute({
			action: () =>
				adminResetPassword({
					userId: user.id,
					userName: user.name,
					userEmail: user.email
				}),
			loadingMessage: "Redefinindo senha e enviando email...",
			successMessage: (res) => res.message,
			onSuccess: () => {
				setOpen(false)
			}
		})
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<Tooltip>
				<TooltipTrigger asChild>
					<DialogTrigger asChild>
						<Button variant="ghost" size="icon">
							<KeyRound className="size-4" />
							<span className="sr-only">Redefinir Senha</span>
						</Button>
					</DialogTrigger>
				</TooltipTrigger>
				<TooltipContent>
					<p>Redefinir Senha</p>
				</TooltipContent>
			</Tooltip>
			<DialogContent className="sm:max-w-[440px]">
				<DialogHeader>
					<DialogTitle>Redefinir Senha</DialogTitle>
					<DialogDescription>
						Uma nova senha será gerada e enviada para o email{" "}
						<span className="font-bold text-primary">{user.email}</span>.
					</DialogDescription>
				</DialogHeader>
				<div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
					<p className="text-sm text-amber-800">
						<strong>Atenção:</strong> A senha atual do usuário será substituída por uma nova senha gerada automaticamente. O usuário receberá a nova senha por email.
					</p>
				</div>
				<DialogFooter className="gap-2 sm:gap-0">
					<Button variant="outline" onClick={() => setOpen(false)}>
						Cancelar
					</Button>
					<Button onClick={handleReset}>
						<KeyRound className="mr-2 size-4" />
						Enviar Nova Senha
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
