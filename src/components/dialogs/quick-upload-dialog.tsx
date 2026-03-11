"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { FormProvider, useForm } from "react-hook-form"
import { toast } from "sonner"
import type { z } from "zod"

import { getSimulationById, updateSimulation } from "@/actions/simulations"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SimulationStep5 } from "@/components/forms/new-simulation/step-5-documents"
import { editSimulationStep5Schema } from "@/components/forms/new-simulation/validation/new-simulation"

type QuickUploadSchema = z.infer<typeof editSimulationStep5Schema>

interface QuickUploadDialogProps {
    simulationId: string
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function QuickUploadDialog({ simulationId, open, onOpenChange }: QuickUploadDialogProps) {
    const queryClient = useQueryClient()
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Fetch simulation data to populate existing documents
    const { data: queryData, isLoading, error } = useQuery({
        queryKey: ["simulation-details", simulationId],
        queryFn: () => getSimulationById(simulationId),
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        enabled: open && !!simulationId
    })

    const form = useForm<QuickUploadSchema>({
        resolver: zodResolver(editSimulationStep5Schema),
        mode: "onChange"
    })

    // Populate form when data is loaded
    useEffect(() => {
        if (queryData?.success && queryData.data) {
            const { data } = queryData
            // Initialize form with undefined (zod schema expects optional files) or current structure
            // Since this is only for step 5, we rely on the fact that file inputs handle their own display 
            // state via the FileInput component if value is provided.
            // However, for typical file inputs logic in this project, we start clean or undefined.
            // The FileInput components likely don't show "existing" files from parsing a URL string in the value prop 
            // unless specifically handled, but `step-5-documents` seems to use `form.watch` or direct control.
            // Looking at `EditSimulationForm`, it initializes these as `undefined`.

            form.reset({
                rgCnhSocios: undefined,
                balancoDRE2022: undefined,
                balancoDRE2023: undefined,
                balancoDRE2024: undefined,
                relacaoFaturamento: undefined,
                comprovanteEndereco: undefined,
                irpfSocios: undefined,
                fotosOperacao: undefined,
                contaDeEnergia: undefined,
                balancoDRE2025: undefined,
                contratoSocial: undefined,
                proposta: undefined,
                comprovantePropriedade: undefined
            })
        }
    }, [queryData, form])

    const onSubmit = async (data: QuickUploadSchema) => {
        if (!queryData?.success || !queryData.data?.customer?.id) {
            toast.error("Erro ao identificar o cliente da simulação.")
            return
        }

        setIsSubmitting(true)
        try {
            const res = await updateSimulation({
                simulationId,
                customerId: queryData.data.customer.id,
                data: data as any // Cast safe because we are sending partial update that API accepts
            })

            if (res.success) {
                queryClient.invalidateQueries({ queryKey: ["simulations"] })
                queryClient.invalidateQueries({ queryKey: ["simulation-details", simulationId] })
                // Also invalidate files list if it exists
                queryClient.invalidateQueries({ queryKey: ["simulation-files", simulationId] })

                toast.success("Documentos enviados com sucesso!")
                onOpenChange(false)
            } else {
                throw new Error(res.message)
            }
        } catch (err: any) {
            toast.error(err.message || "Ocorreu um erro ao salvar os documentos.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Upload Rápido de Documentos</DialogTitle>
                    <DialogDescription>
                        Anexe os documentos faltantes para esta simulação.
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <p className="ml-4">Carregando dados...</p>
                    </div>
                ) : error || !queryData?.success ? (
                    <div className="text-center text-destructive py-4">
                        Erro ao carregar simulação. Tente novamente mais tarde.
                    </div>
                ) : (
                    <FormProvider {...form}>
                        <SimulationStep5
                            onSubmit={form.handleSubmit(onSubmit)}
                            onBack={() => onOpenChange(false)}
                            // We hide the "create order" toggle for quick upload to keep it focused
                            showInputs={false}
                        />
                    </FormProvider>
                )}
            </DialogContent>
        </Dialog>
    )
}
