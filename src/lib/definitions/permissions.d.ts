import type { Database } from "@/lib/definitions/supabase"

// A "fonte da verdade" para todas as permissões que existem no sistema.
export type Permission = Database["public"]["Tables"]["permissions"]["Row"]

// A tabela que define as permissões padrão para cada função (role).
export type RolePermission = Database["public"]["Tables"]["role_permissions"]["Row"]

// Tipo para o retorno da nossa função RPC 'get_user_permissions_detailed'
// Espelha o tipo gerado em supabase.d.ts para consistência.
export type UserPermissionDetails = Database["public"]["Functions"]["get_user_permissions_detailed"]["Returns"][number]
