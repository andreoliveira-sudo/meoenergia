"use client"

import { Power, PowerOff } from "lucide-react"
import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { toggleUserStatus } from "@/actions/users"
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

interface ToggleUserStatusButtonProps {
	user: User
}

export function ToggleUserStatusButton({ user }: ToggleUserStatusButtonProps) {
	const [open, setOpen] = useState(false)
	const { execute } = useOperationFeedback()
	const queryClient = useQueryClient()

	const isActive = user.is_active
	const isAdmin = user.role === "admin"

	// Não mostrar botão para admins (não podem ser desativados)
	if (isAdmin && isActive) {
		return null
	}

	const handleToggle = () => {
		execute({
			action: () =>
				toggleUserStatus({
					userId: user.id,
					isActive: !isActive
				}),
			loadingMessage: isActive ? "Desativando usuário..." : "Ativando usuário...",
			successMessage: (res) => res.message,
			onSuccess: () => {
				setOpen(false)
				queryClient.invalidateQueries({ queryKey: ["users"] })
			}
		})
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<Tooltip>
				<TooltipTrigger asChild>
					<DialogTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className={isActive ? "text-red-600 hover:text-red-700 hover:bg-red-50" : "text-green-600 hover:text-green-700 hover:bg-green-50"}
						>
							{isActive ? <PowerOff className="size-4" /> : <Power className="size-4" />}
							<span className="sr-only">{isActive ? "Desativar" : "Ativar"}</span>
						</Button>
					</DialogTrigger>
				</TooltipTrigger>
				<TooltipContent>
					<p>{isActive ? "Desativar Usuário" : "Ativar Usuário"}</p>
				</TooltipContent>
			</Tooltip>
			<DialogContent className="sm:max-w-[440px]">
				<DialogHeader>
					<DialogTitle>
						{isActive ? "Desativar Usuário" : "Ativar Usuário"}
					</DialogTitle>
					<DialogDescription>
						{isActive ? (
							<>
								O usuário <span className="font-bold text-primary">{user.name}</span> ({user.email}) será desativado e não poderá mais fazer login no sistema.
							</>
						) : (
							<>
								O usuário <span className="font-bold text-primary">{user.name}</span> ({user.email}) será reativado e poderá fazer login novamente.
							</>
						)}
					</DialogDescription>
				</DialogHeader>
				{isActive ? (
					<div className="rounded-lg border border-red-200 bg-red-50 p-4">
						<p className="text-sm text-red-800">
							<strong>Atenção:</strong> O usuário desativado não conseguirá acessar o sistema. Essa ação pode ser revertida a qualquer momento reativando o usuário.
						</p>
					</div>
				) : (
					<div className="rounded-lg border border-green-200 bg-green-50 p-4">
						<p className="text-sm text-green-800">
							<strong>Informação:</strong> O usuário será reativado e poderá fazer login normalmente no sistema com suas credenciais anteriores.
						</p>
					</div>
				)}
				<DialogFooter className="gap-2 sm:gap-0">
					<Button variant="outline" onClick={() => setOpen(false)}>
						Cancelar
					</Button>
					<Button
						onClick={handleToggle}
						variant={isActive ? "destructive" : "default"}
						className={!isActive ? "bg-green-600 hover:bg-green-700" : ""}
					>
						{isActive ? (
							<>
								<PowerOff className="mr-2 size-4" />
								Desativar
							</>
						) : (
							<>
								<Power className="mr-2 size-4" />
								Ativar
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
