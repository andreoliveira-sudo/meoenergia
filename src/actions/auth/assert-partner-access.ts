"use server"

import type { Database } from "@/lib/definitions/supabase"
import { createClient } from "@/lib/supabase/server"

type UserRole = Database["public"]["Enums"]["user_role"]
type PartnerStatus = Database["public"]["Enums"]["enum_partners_status"]

interface PartnerAccessResult {
    allowed: boolean
    reason?: "not_authenticated" | "pending_approval" | "inactive" | "rejected"
    redirectTo?: string
    userRole?: UserRole | null
}

/**
 * Valida se o usuário atual tem permissão para acessar o sistema.
 * - Admins e staff: sempre permitido
 * - Partners: devem ter status = 'approved' E is_active = true
 * - Sellers: não afetados por esta validação (por enquanto)
 */
async function assertPartnerAccess(): Promise<PartnerAccessResult> {
    const supabase = await createClient()

    const {
        data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
        return { allowed: false, reason: "not_authenticated", redirectTo: "/" }
    }

    // Buscar role do usuário
    const { data: userData, error: userError } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (userError || !userData) {
        // Se não encontrar perfil, tratar como não autenticado
        return { allowed: false, reason: "not_authenticated", redirectTo: "/" }
    }

    const userRole = userData.role as UserRole

    // Admins e staff sempre têm acesso
    if (userRole === "admin" || userRole === "staff") {
        return { allowed: true, userRole }
    }

    // Sellers: por enquanto não validamos status (a pedido do cliente)
    if (userRole === "seller") {
        return { allowed: true, userRole }
    }

    // Partners: precisam validar status e is_active
    if (userRole === "partner") {
        const { data: partner, error: partnerError } = await supabase
            .from("partners")
            .select("status, is_active")
            .eq("user_id", user.id)
            .single()

        if (partnerError || !partner) {
            // Partner sem registro na tabela partners = não autorizado
            return { allowed: false, reason: "not_authenticated", redirectTo: "/", userRole }
        }

        const status = partner.status as PartnerStatus

        // Parceiro rejeitado
        if (status === "rejected") {
            return { allowed: false, reason: "rejected", redirectTo: "/awaiting-approval", userRole }
        }

        // Parceiro pendente
        if (status === "pending") {
            return { allowed: false, reason: "pending_approval", redirectTo: "/awaiting-approval", userRole }
        }

        // Parceiro aprovado mas inativo
        if (status === "approved" && !partner.is_active) {
            return { allowed: false, reason: "inactive", redirectTo: "/awaiting-approval", userRole }
        }

        // Parceiro aprovado e ativo
        return { allowed: true, userRole }
    }

    // Qualquer outro role desconhecido
    return { allowed: true, userRole }
}

export default assertPartnerAccess
