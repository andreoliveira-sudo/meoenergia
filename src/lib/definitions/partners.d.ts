import type { Database } from "@/lib/definitions/supabase"

type Partner = Database["public"]["Tables"]["partners"]["Row"]
type PartnerWithSellerName = Partner & { seller_name: string | null }

type PartnerStatus = Database["public"]["Enums"]["enum_partners_status"]

export type { Partner, PartnerWithSellerName, PartnerStatus }
