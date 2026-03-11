import type { Database } from "@/lib/definitions/supabase"

export type User = Database["public"]["Tables"]["users"]["Row"]

export type UserWithAccess = User & {
	has_system_access: boolean
	access_reason: string
}
