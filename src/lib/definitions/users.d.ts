import type { Database } from "@/lib/definitions/supabase"

export type User = Database["public"]["Tables"]["users"]["Row"]
