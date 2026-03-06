import type { Database } from "@/lib/supabase"

export type Seller = Database["public"]["Tables"]["sellers"]["Row"]
export type SellerStatus = Database["public"]["Enums"]["enum_partners_status"]
