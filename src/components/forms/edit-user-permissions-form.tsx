"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Save, Shield } from "lucide-react"
import { useEffect, useMemo, useTransition, useState } from "react"
import { useForm } from "react-hook-form"
import { useOperationFeedback } from "@/components/feedback/operation-feedback"
import { getAllPermissions } from "@/actions/permissions"
import { getUserPermissionsDetailed, updateUserPermissions } from "@/actions/users"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import type { PermissionId } from "@/lib/constants"
import { RESOURCE_TRANSLATIONS } from "@/lib/constants/permissions-translations"
import type { User } from "@/lib/definitions/users"

interface EditUserPermissionsFormProps {
	user: User
	onSuccess: () => void
}

interface PermissionData {
	id: string
	description: string
}

const groupPermissions = (permissions: PermissionData[]) => {
	const grouped = permissions.reduce(
		(acc, permission) => {
			const [resource] = permission.id.split(":")
			if (!acc[resource]) {
				acc[resource] = []
			}
			acc[resource].push(permission)
			return acc
		},
		{} as Record<string, PermissionData[]>
	)
	return Object.entries(grouped)
}

export function EditUserPermissionsForm({ user, onSuccess }: EditUserPermissionsFormProps) {
	const [isPending, startTransition] = useTransition()
	const queryClient = useQueryClient()
	const { execute } = useOperationFeedback()
	// Tracks permissions that are loaded dynamically
	const [permissionIds, setPermissionIds] = useState<string[]>([])

	const { data: availablePermissionsResponse, isLoading: isLoadingPermissions } = useQuery({
		queryKey: ["all-permissions"],
		queryFn: getAllPermissions
	})

	const { data: userPermissions, isLoading: isLoadingUserPermissions } = useQuery({
		queryKey: ["user-permissions", user.id],
		queryFn: () => getUserPermissionsDetailed(user.id),
		enabled: !!user.id
	})

	const form = useForm<Record<string, boolean>>({
		defaultValues: {}
	})

	// When permissions load, set initial form values
	useEffect(() => {
		if (availablePermissionsResponse?.success && availablePermissionsResponse.data) {
			const allPerms = availablePermissionsResponse.data
			const ids = allPerms.map((p) => p.id)
			setPermissionIds(ids)

			// Initial state: all false by default
			const initialState: Record<string, boolean> = {}
			ids.forEach((id) => {
				initialState[id] = false
			})

			// Override with user permissions
			if (userPermissions) {
				userPermissions.forEach((p) => {
					initialState[p.permission_id] = p.effective
				})
			}

			form.reset(initialState)
		}
	}, [availablePermissionsResponse, userPermissions, form])

	const groupedPermissions = useMemo(() => {
		if (availablePermissionsResponse?.success && availablePermissionsResponse.data) {
			return groupPermissions(availablePermissionsResponse.data)
		}
		return []
	}, [availablePermissionsResponse])

	const handleSelectAll = (permissions: PermissionData[], newValue: boolean) => {
		permissions.forEach((permission) => {
			form.setValue(permission.id, newValue, { shouldDirty: true })
		})
	}

	function onSubmit(data: Record<string, boolean>) {
		// Filter only true/false values for known permissions
		// Validation is loose here as we are dealing with dynamic keys
		const permissionsPayload = data as Record<PermissionId, boolean>

		execute({
			action: () => updateUserPermissions({
				userId: user.id,
				permissions: permissionsPayload
			}),
			loadingMessage: "Salvando permissões...",
			successMessage: (res) => res.message,
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ["user-permissions", user.id] })
				onSuccess()
			}
		})
	}

	const isLoading = isLoadingPermissions || isLoadingUserPermissions

	if (isLoading) {
		return (
			<div className="space-y-4">
				{[1, 2, 3].map((i) => (
					<Skeleton key={i} className="h-12 w-full rounded-md" />
				))}
			</div>
		)
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				<div className="max-h-[60vh] overflow-y-auto pr-2">
					<Accordion type="multiple" defaultValue={["admin"]} className="w-full space-y-2">
						{groupedPermissions.map(([resource, permissions]) => {
							const activeCount = permissions.filter(p => form.watch(p.id)).length
							const totalCount = permissions.length
							const isAllSelected = activeCount === totalCount
							const title = RESOURCE_TRANSLATIONS[resource] || resource

							return (
								<AccordionItem key={resource} value={resource} className="border rounded-lg px-4 data-[state=open]:bg-muted/30">
									<AccordionTrigger className="hover:no-underline py-4">
										<div className="flex items-center gap-4 flex-1">
											<div className="flex items-center gap-2">
												<Shield className="size-4 text-muted-foreground" />
												<span className="font-semibold text-foreground">{title}</span>
											</div>
											<Badge variant={activeCount > 0 ? "secondary" : "outline"} className="ml-auto mr-4">
												{activeCount}/{totalCount}
											</Badge>
										</div>
									</AccordionTrigger>
									<AccordionContent className="pt-2 pb-6">
										<div className="flex justify-end mb-4 border-b pb-2">
											<Button
												type="button"
												variant="ghost"
												size="sm"
												onClick={() => handleSelectAll(permissions, !isAllSelected)}
												className="text-xs text-muted-foreground hover:text-primary"
											>
												{isAllSelected ? "Desmarcar Todos" : "Marcar Todos"}
											</Button>
										</div>
										<div className="grid grid-cols-1 gap-y-4">
											{permissions.map((permission) => (
												<FormField
													key={permission.id}
													control={form.control}
													name={permission.id}
													render={({ field }) => (
														<FormItem className="flex flex-row items-center justify-between rounded-md border p-3 hover:bg-muted/50 transition-colors">
															<div className="space-y-0.5">
																<FormLabel className="text-sm font-medium">
																	{permission.description || permission.id}
																</FormLabel>
																<FormDescription className="text-xs">
																	{permission.id}
																</FormDescription>
															</div>
															<FormControl>
																<Switch
																	checked={field.value}
																	onCheckedChange={field.onChange}
																/>
															</FormControl>
														</FormItem>
													)}
												/>
											))}
										</div>
									</AccordionContent>
								</AccordionItem>
							)
						})}
					</Accordion>
				</div>

				<div className="pt-4 border-t flex justify-end gap-2 bg-background">
					<Button type="submit" disabled={isPending}>
						{isPending ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 size-4" />}
						Salvar Alterações
					</Button>
				</div>
			</form>
		</Form>
	)
}
