import createBrand from "@/actions/equipments/create-brand"
import createEquipment from "@/actions/equipments/create-equipment"
import createStructureType from "@/actions/equipments/create-structure-type"
import getAllBrands from "@/actions/equipments/get-all-brands"
import getAllEquipments from "@/actions/equipments/get-all-equipments"
import getBrandsByEquipmentType from "@/actions/equipments/get-brands-by-type"
import getEquipmentTypes from "@/actions/equipments/get-equipment-types"
import getEquipmentsByBrandAndType from "@/actions/equipments/get-equipments-by-brand-and-type"
import getStructureTypes from "@/actions/equipments/get-structure-types"
import deleteBrand from "@/actions/equipments/delete-brand"
import updateBrand from "@/actions/equipments/update-brand"
import deleteStructureType from "@/actions/equipments/delete-structure-type"
import updateStructureType from "@/actions/equipments/update-structure-type"
import deleteEquipment from "@/actions/equipments/delete-equipment"
import updateEquipment from "@/actions/equipments/update-equipment"

export {
	getBrandsByEquipmentType,
	getEquipmentsByBrandAndType,
	getEquipmentTypes,
	getStructureTypes,
	createStructureType,
	createBrand,
	createEquipment,
	getAllBrands,
	getAllEquipments,
	deleteBrand,
	updateBrand,
	deleteStructureType,
	updateStructureType,
	deleteEquipment,
	updateEquipment
}
