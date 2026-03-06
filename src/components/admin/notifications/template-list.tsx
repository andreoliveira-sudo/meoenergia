'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Pencil, Save, AlertCircle, Info, FileText, Users, Activity } from 'lucide-react'

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { NotificationTemplate } from '@/actions/settings/get-templates'
import updateNotificationTemplate from '@/actions/settings/update-template'
import { useRouter } from 'next/navigation'

const formSchema = z.object({
    whatsapp_text: z.string().min(1, 'O texto da mensagem é obrigatório'),
    active: z.boolean(),
})

interface TemplateListProps {
    initialTemplates: NotificationTemplate[]
}

export default function TemplateList({ initialTemplates }: TemplateListProps) {
    const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null)
    const [open, setOpen] = useState(false)
    const router = useRouter()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            whatsapp_text: '',
            active: true,
        },
    })

    function handleEdit(template: NotificationTemplate) {
        setEditingTemplate(template)
        form.reset({
            whatsapp_text: template.whatsapp_text || template.content || '',
            active: template.active,
        })
        setOpen(true)
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!editingTemplate) return

        try {
            const result = await updateNotificationTemplate({
                id: editingTemplate.id,
                whatsapp_text: values.whatsapp_text,
                active: values.active,
            })

            if (result.success) {
                toast.success('Template atualizado com sucesso')
                setOpen(false)
                router.refresh()
            } else {
                toast.error(result.message || 'Erro ao atualizar template')
            }
        } catch (error) {
            toast.error('Ocorreu um erro inesperado')
            console.error(error)
        }
    }

    // Agrupar templates por categoria
    const orderTemplates = initialTemplates.filter(t => t.category === 'Order' || !t.category)
    const partnerTemplates = initialTemplates.filter(t => t.category === 'Partner')
    const simulationTemplates = initialTemplates.filter(t => t.category === 'Simulation')

    return (
        <div className="space-y-6">
            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Variáveis Disponíveis</AlertTitle>
                <AlertDescription>
                    Você pode usar as seguintes variáveis no texto das mensagens para personalizá-las:
                    <ul className="list-disc list-inside mt-2 font-mono text-xs">
                        <li>{'{{name}}'} - Nome (Contato)</li>
                        <li>{'{{customer_name}}'} - Razão Social / Nome Cliente (Pedidos Aprovados)</li>
                        <li>{'{{order_id}}'} - ID do Pedido</li>
                        <li>{'{{mensalidade}}'} - Valor da Parcela (Pedidos Aprovados)</li>
                        <li>{'{{prazo}}'} - Prazo em Meses (Pedidos Aprovados)</li>
                        <li>{'{{simulation_id}}'} - ID da Simulação (Notifications de Simulação)</li>
                        <li>{'{{total_value}}'} - Valor Total (Notifications de Simulação)</li>
                    </ul>
                </AlertDescription>
            </Alert>

            <Tabs defaultValue="orders" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger value="orders" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Pedidos
                    </TabsTrigger>
                    <TabsTrigger value="simulations" className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Simulações
                    </TabsTrigger>
                    <TabsTrigger value="partners" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Parceiros
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="orders" className="mt-6">
                    <TemplateGrid
                        templates={orderTemplates}
                        onEdit={handleEdit}
                        emptyMessage="Nenhum template de pedido encontrado."
                    />
                </TabsContent>

                <TabsContent value="simulations" className="mt-6">
                    <TemplateGrid
                        templates={simulationTemplates}
                        onEdit={handleEdit}
                        emptyMessage="Nenhum template de simulação encontrado."
                    />
                </TabsContent>

                <TabsContent value="partners" className="mt-6">
                    <TemplateGrid
                        templates={partnerTemplates}
                        onEdit={handleEdit}
                        emptyMessage="Nenhum template de parceiro encontrado."
                    />
                </TabsContent>
            </Tabs>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Editar Template</DialogTitle>
                        <DialogDescription>
                            {editingTemplate?.name}
                        </DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="whatsapp_text"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mensagem (WhatsApp)</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Olá {{name}}..."
                                                className="min-h-[150px] font-mono text-sm"
                                                {...field}
                                            />
                                        </FormControl>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <AlertCircle className="h-3 w-3" />
                                            <span>Variáveis: {'{{name}}'}, {'{{customer_name}}'}, {'{{order_id}}'}, {'{{mensalidade}}'}, {'{{prazo}}'}</span>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="active"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                        <div className="space-y-0.5">
                                            <FormLabel>Ativo</FormLabel>
                                            <DialogDescription>
                                                Habilitar o envio automático deste template
                                            </DialogDescription>
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

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit">
                                    <Save className="mr-2 h-4 w-4" />
                                    Salvar Alterações
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function TemplateGrid({
    templates,
    onEdit,
    emptyMessage
}: {
    templates: NotificationTemplate[],
    onEdit: (t: NotificationTemplate) => void,
    emptyMessage: string
}) {
    if (templates.length === 0) {
        return <div className="text-muted-foreground text-sm italic">{emptyMessage}</div>
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
                <Card key={template.id} className="flex flex-col">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-base">{template.name}</CardTitle>
                                <CardDescription className="text-xs">
                                    {template.trigger_key || 'Sem gatilho'}
                                </CardDescription>
                            </div>
                            <Badge variant={template.active ? 'default' : 'secondary'}>
                                {template.active ? 'Ativo' : 'Inativo'}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <div className="rounded-md bg-muted p-3 text-xs italic text-muted-foreground whitespace-pre-wrap">
                            {template.whatsapp_text || template.content}
                        </div>
                        {template.description && (
                            <p className="mt-2 text-xs text-muted-foreground">
                                {template.description}
                            </p>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => onEdit(template)}
                        >
                            <Pencil className="mr-2 h-3 w-3" />
                            Editar Template
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}
