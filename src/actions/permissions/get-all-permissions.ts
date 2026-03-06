"use server"

import { createClient } from "@/lib/supabase/server"
import type { ActionResponse } from "@/types/action-response"

export interface Permission {
    id: string
    description: string
}

export async function getAllPermissions(): Promise<ActionResponse<Permission[]>> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase.from("permissions").select("id, description").order("id")

        if (error) {
            console.error("Error fetching permissions:", error)
            return {
                success: false,
                message: "Erro ao buscar permissões."
            }
        }

        return {
            success: true,
            message: "Permissões carregadas com sucesso.",
            data: data
        }
    } catch (error) {
        console.error("Unexpected error fetching permissions:", error)
        return {
            success: false,
            message: "Erro inesperado ao buscar permissões."
        }
    }
}
