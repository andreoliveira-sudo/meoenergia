import brazilianStates from "@/lib/constants/brazilian-states"
import connectionVoltageTypes from "@/lib/constants/connection-voltage-types"
import energyProviders from "@/lib/constants/energy-providers"
import { INVERTER_TYPE_ID, MODULE_TYPE_ID, OTHERS_TYPE_ID } from "@/lib/constants/equipment-types-ids"
import PERMISSIONS from "@/lib/constants/permissions"
import MONTSERRAT_BASE64 from "@/lib/constants/montserrat-base64"
import MONTSERRAT_SEMIBOLD_BASE64 from "@/lib/constants/montserrat-semibold-base64"
import { documentFields, documentFieldsPF, documentFieldsPJ, type DocumentFieldDef } from "@/lib/constants/document-fields"

type PermissionId = (typeof PERMISSIONS)[number]

export {
	energyProviders,
	brazilianStates,
	connectionVoltageTypes,
	INVERTER_TYPE_ID,
	MODULE_TYPE_ID,
	OTHERS_TYPE_ID,
	PERMISSIONS,
	type PermissionId,
	MONTSERRAT_BASE64,
	MONTSERRAT_SEMIBOLD_BASE64,
	documentFields,
	documentFieldsPF,
	documentFieldsPJ,
	type DocumentFieldDef
}
