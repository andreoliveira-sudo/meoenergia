import Link from "next/link"

import { signOut } from "@/actions/auth"
import { getCurrentPartnerDetails } from "@/actions/partners"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const statusMessages = {
    pending: {
        title: "Cadastro em Análise",
        description: "Seu cadastro está sendo analisado pela nossa equipe. Você receberá uma notificação assim que for aprovado.",
        icon: "⏳"
    },
    rejected: {
        title: "Cadastro Rejeitado",
        description: "Infelizmente seu cadastro não foi aprovado. Entre em contato com o suporte para mais informações.",
        icon: "❌"
    },
    inactive: {
        title: "Conta Desativada",
        description: "Sua conta está temporariamente desativada. Entre em contato com o suporte se precisar de ajuda.",
        icon: "🔒"
    }
}

export const AwaitingApprovalPage = async () => {
    const partnerDetails = await getCurrentPartnerDetails()

    // Determinar qual mensagem exibir
    let statusKey: "pending" | "rejected" | "inactive" = "pending"

    if (partnerDetails) {
        if (partnerDetails.status === "rejected") {
            statusKey = "rejected"
        } else if (partnerDetails.status === "approved" && !partnerDetails.isActive) {
            statusKey = "inactive"
        }
    }

    const message = statusMessages[statusKey]

    const handleLogout = async () => {
        "use server"
        await signOut()
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="mb-4 text-6xl">{message.icon}</div>
                    <CardTitle>{message.title}</CardTitle>
                    <CardDescription className="mt-2">{message.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <form action={handleLogout}>
                        <Button type="submit" variant="outline" className="w-full">
                            Sair da Conta
                        </Button>
                    </form>
                    <Link href="mailto:suporte@meoerp.com.br" className="text-sm text-muted-foreground hover:underline">
                        Precisa de ajuda? Entre em contato
                    </Link>
                </CardContent>
            </Card>
        </div>
    )
}

export default AwaitingApprovalPage
