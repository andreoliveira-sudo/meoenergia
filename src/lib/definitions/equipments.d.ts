import type { Database } from "@/lib/definitions/supabase"

type Equipment = Database["public"]["Tables"]["equipments"]["Row"]
type EquipmentBrand = Database["public"]["Tables"]["equipment_brands"]["Row"]
type EquipmentType = Database["public"]["Tables"]["equipment_types"]["Row"]
type StructureType = Database["public"]["Tables"]["structure_types"]["Row"]
type EquipmentWithRelations = Equipment & {
	equipment_types: { name: string } | null
	equipment_brands: { name: string } | null
}

export type { Equipment, EquipmentBrand, EquipmentType, StructureType, EquipmentWithRelations }
