"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, PlusCircle } from "lucide-react"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { addGroupRuleAction } from "@/actions/groups"
import { getAllPartners } from "@/actions/partners"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { PartnerWithSellerName } from "@/lib/definitions/partners"
import { formatCnpj } from "@/lib/formatters"
import { createRuleSchema, type CreateRuleSchema } from "@/lib/validations/create-group-rule"

type CreateRuleDialogProps = {
	groupId: string
}

export const CreateRuleDialog = ({ groupId }: CreateRuleDialogProps) => {
	const [open, setOpen] = useState(false)
	const [isPending, startTransition] = useTransition()
	const queryClient = useQueryClient()

	const form = useForm<CreateRuleSchema>({
		resolver: zodResolver(createRuleSchema),
		defaultValues: {
			rule_type: "include",
			target_id: ""
		}
	})

	const { data: partners, isLoading: isLoadingPartners } = useQuery<PartnerWithSellerName[]>({
		queryKey: ["partners"],
		queryFn: () => getAllPartners()
	})

	const handleClose = () => {
		setOpen(false)
		form.reset({
			rule_type: "include",
			target_id: ""
		})
	}

	const onSubmit = (values: CreateRuleSchema) => {
		startTransition(async () => {
			const result = await addGroupRuleAction({
				groupId,
				entity: "partners",
				rule_type: values.rule_type,
				target_id: values.target_id
			})

			if (result.success) {
				toast.success("Regra criada com sucesso")
				await queryClient.invalidateQueries({ queryKey: ["group-rules", groupId] })
				handleClose()
			} else {
				toast.error("Erro ao criar regra", {
					description: result.message
				})
			}
		})
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => {
				setOpen(nextOpen)
				if (!nextOpen) {
					form.reset({
						rule_type: "include",
						target_id: ""
					})
				}
			}}
		>
			<DialogTrigger asChild>
				<Button>
					<PlusCircle className="mr-2 h-4 w-4" />
					Nova Regra
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Criar nova regra</DialogTitle>
					<DialogDescription>Defina um parceiro e o tipo da regra</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="rule_type"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Tipo da regra</FormLabel>
									<FormControl>
										<Select onValueChange={field.onChange} value={field.value} disabled={isPending}>
											<SelectTrigger>
												<SelectValue placeholder="Selecione o tipo da regra" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="include">Incluir</SelectItem>
												<SelectItem value="exclude">Excluir</SelectItem>
											</SelectContent>
										</Select>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="target_id"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Parceiro</FormLabel>
									<FormControl>
										<Select
											onValueChange={field.onChange}
											value={field.value || undefined}
											disabled={isLoadingPartners || isPending}
										>
											<SelectTrigger>
												<SelectValue placeholder={isLoadingPartners ? "Carregando parceiros..." : "Selecione um parceiro"} />
											</SelectTrigger>
											<SelectContent>
												{isLoadingPartners ? (
													<SelectItem value="loading" disabled>
														Carregando parceiros...
													</SelectItem>
												) : partners && partners.length > 0 ? (
													partners.map((partner) => (
														<SelectItem key={partner.id} value={partner.id}>
															<div className="flex flex-col">
																<span className="font-medium">{partner.legal_business_name}</span>
																<span className="text-xs text-muted-foreground">{formatCnpj(partner.cnpj)}</span>
															</div>
														</SelectItem>
													))
												) : (
													<SelectItem value="empty" disabled>
														Nenhum parceiro disponivel
													</SelectItem>
												)}
											</SelectContent>
										</Select>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<DialogFooter className="pt-2">
							<Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
								Cancelar
							</Button>
							<Button type="submit" disabled={isPending}>
								{isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
								Criar regra
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
