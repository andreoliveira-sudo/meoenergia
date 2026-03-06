"use server"

import { PostgrestError } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

import type { Customer } from "@/lib/definitions/customers"
import type { Simulation } from "@/lib/definitions/simulations"
import { createAdminClient } from "@/lib/supabase/admin"
import type { ActionResponse } from "@/types/action-response"
import { uploadSimulationFiles } from "."
import type { EditSimulationData } from "@/components/forms/new-simulation/validation/new-simulation"
import { documentFields } from "@/lib/constants"

const parseCurrencyStringToNumber = (value: string | undefined | null): number => {
	if (!value) return 0
	const sanitizedValue = value.replace(/\./g, "").replace(",", ".")
	const numberValue = parseFloat(sanitizedValue)
	return Number.isNaN(numberValue) ? 0 : numberValue
}

interface UpdateSimulationParams {
	simulationId: string
	customerId: string
	data: EditSimulationData
}

async function updateSimulation({ simulationId, customerId, data }: UpdateSimulationParams): Promise<ActionResponse<null>> {
	const supabaseAdmin = createAdminClient()

	try {
		// 1. Atualizar os dados do cliente
		const customerData: Partial<Customer> = {
			company_name: data.legalName,
			name: data.name,
			incorporation_date: data.incorporationDate ? data.incorporationDate.split("/").reverse().join("-") : undefined,
			annual_revenue: parseCurrencyStringToNumber(data.annualRevenue),
			contact_name: data.contactName,
			contact_phone: data.contactPhone.replace(/\D/g, ""),
			contact_email: data.contactEmail,
			postal_code: data.cep.replace(/\D/g, ""),
			street: data.street,
			number: data.number,
			complement: data.complement,
			neighborhood: data.neighborhood,
			city: data.city,
			state: data.state
			// Não atualizamos o CNPJ, pois é um identificador.
		}

		const { error: customerError } = await supabaseAdmin.from("customers").update(customerData).eq("id", customerId)

		if (customerError) {
			console.error("Erro ao atualizar cliente:", customerError)
			throw customerError
		}

		// 2. Atualizar os dados da simulação
		const simulationData: Partial<Simulation> = {
			customer_id: customerId, // Garantindo o vínculo!
			system_power: parseCurrencyStringToNumber(data.systemPower),
			current_consumption: parseCurrencyStringToNumber(data.currentConsumption),
			energy_provider: data.energyProvider,
			structure_type: data.structureType,
			connection_voltage: data.connectionVoltage,
			kit_module_id: Number(data.kit_module),
			kit_inverter_id: Number(data.kit_inverter),
			kit_others: data.kit_others ? Number(data.kit_others) : null,
			equipment_value: parseCurrencyStringToNumber(data.equipmentValue),
			labor_value: parseCurrencyStringToNumber(data.laborValue),
			other_costs: parseCurrencyStringToNumber(data.otherCosts),
			notes: data.notes
		}

		const { error: simulationError } = await supabaseAdmin.from("simulations").update(simulationData).eq("id", simulationId)

		if (simulationError) {
			console.error("Erro ao atualizar simulação:", simulationError)
			throw simulationError
		}

		// 3. Build FormData e fazer upload de novos arquivos, se houver
		const uploadFormData = new FormData()
		for (const field of documentFields) {
			const fileList = data[field.name as keyof EditSimulationData]
			if (fileList && Array.isArray(fileList) && fileList.length > 0 && fileList[0] instanceof File) {
				uploadFormData.append(field.name, fileList[0])
			}
		}

		const uploadResponse = await uploadSimulationFiles(simulationId, uploadFormData)
		if (!uploadResponse.success) {
			// Não consideramos um erro crítico, mas registramos
			console.warn("A simulação foi atualizada, mas houve um erro no upload de novos arquivos:", uploadResponse.message)
		}

		revalidatePath("/dashboard/simulations")

		return {
			success: true,
			message: "Simulação atualizada com sucesso!",
			data: null
		}
	} catch (error) {
		console.error("Erro inesperado em updateSimulation:", error)
		if (error instanceof PostgrestError) {
			return { success: false, message: `Erro no banco de dados: ${error.message}` }
		}
		return { success: false, message: "Ocorreu um erro inesperado ao salvar as alterações." }
	}
}

export default updateSimulation
