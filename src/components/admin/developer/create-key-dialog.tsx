'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Copy, AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ScrollArea } from "@/components/ui/scroll-area"

import createApiKey from '@/actions/developer/create-api-key'

const formSchema = z.object({
    name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    scopes: z.array(z.string()).refine((value) => value.length > 0, {
        message: 'Selecione pelo menos um escopo.',
    }),
})

const AVAILABLE_SCOPES = [
    { id: 'orders:read', label: 'Ver Pedidos' },
    { id: 'orders:write', label: 'Gerenciar Pedidos' },
    { id: 'simulations:read', label: 'Ver Simulações' },
    { id: 'simulations:write', label: 'Gerenciar Simulações' },
    { id: 'partners:read', label: 'Ver Parceiros' },
    { id: 'partners:write', label: 'Gerenciar Parceiros' },
    { id: '*', label: 'Acesso Total (Admin)' },
]

export default function CreateKeyDialog({ userId, onKeyCreated }: { userId: string, onKeyCreated: () => void }) {
    const [open, setOpen] = useState(false)
    const [newKey, setNewKey] = useState<string | null>(null)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            scopes: ['orders:read'],
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            const result = await createApiKey({
                name: values.name,
                scopes: values.scopes,
                userId
            })

            if (result.success && result.data) {
                setNewKey(result.data.key)
                toast.success('Chave API criada com sucesso')
                onKeyCreated()
            } else {
                toast.error(result.message || 'Erro ao criar chave')
            }
        } catch (error) {
            toast.error('Erro inesperado')
        }
    }

    const handleCopy = () => {
        if (newKey) {
            navigator.clipboard.writeText(newKey)
            toast.success('Copiado para a área de transferência')
        }
    }

    const handleClose = () => {
        setOpen(false)
        setNewKey(null)
        form.reset()
    }

    return (
        <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
            <DialogTrigger asChild>
                <Button onClick={() => setOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Chave
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 pb-4">
                    <DialogTitle>Criar Nova Chave de API</DialogTitle>
                    <DialogDescription>
                        Esta chave permitirá acesso externo ao sistema.
                    </DialogDescription>
                </DialogHeader>

                {newKey ? (
                    <div className="space-y-4 p-6 pt-2">
                        <Alert className="border-green-500 bg-green-50">
                            <AlertTitle className="text-green-700">Chave Criada!</AlertTitle>
                            <AlertDescription className="text-green-700">
                                Copie sua chave agora. Por segurança, ela não será exibida novamente.
                            </AlertDescription>
                        </Alert>
                        <div className="flex items-center space-x-2">
                            <div className="grid flex-1 gap-2">
                                <Input readOnly value={newKey} className="font-mono text-sm bg-muted" />
                            </div>
                            <Button type="submit" size="sm" className="px-3" onClick={handleCopy}>
                                <span className="sr-only">Copiar</span>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                        <DialogFooter>
                            <Button type="button" onClick={handleClose}>
                                Concluir
                            </Button>
                        </DialogFooter>
                    </div>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden min-h-0">
                            <div className="flex-1 overflow-y-auto px-6">
                                <div className="space-y-4 pb-6">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nome da Identificação</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ex: Integração Zapier" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="scopes"
                                        render={() => (
                                            <FormItem>
                                                <div className="mb-4">
                                                    <FormLabel className="text-base">Permissões (Escopos)</FormLabel>
                                                    <FormDescription>
                                                        Selecione quais recursos esta chave pode acessar.
                                                    </FormDescription>
                                                </div>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {AVAILABLE_SCOPES.map((scope) => (
                                                        <FormField
                                                            key={scope.id}
                                                            control={form.control}
                                                            name="scopes"
                                                            render={({ field }) => {
                                                                return (
                                                                    <FormItem
                                                                        key={scope.id}
                                                                        className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 shadow-sm hover:bg-accent"
                                                                    >
                                                                        <FormControl>
                                                                            <Checkbox
                                                                                checked={field.value?.includes(scope.id)}
                                                                                onCheckedChange={(checked) => {
                                                                                    return checked
                                                                                        ? field.onChange([...field.value, scope.id])
                                                                                        : field.onChange(
                                                                                            field.value?.filter(
                                                                                                (value) => value !== scope.id
                                                                                            )
                                                                                        )
                                                                                }}
                                                                            />
                                                                        </FormControl>
                                                                        <div className="space-y-1 leading-none">
                                                                            <FormLabel className="cursor-pointer font-normal">
                                                                                {scope.label}
                                                                                <span className="block text-xs text-muted-foreground font-mono mt-1">{scope.id}</span>
                                                                            </FormLabel>
                                                                        </div>
                                                                    </FormItem>
                                                                )
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <DialogFooter className="p-6 pt-4 border-t mt-auto">
                                <Button type="submit">Gerar Chave</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    )
}
