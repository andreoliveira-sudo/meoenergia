"use server"

import type { EditSimulationData } from "@/components/forms/new-simulation/validation/new-simulation"
import { documentFields } from "@/lib/constants"
import type { Customer } from "@/lib/definitions/customers"
import type { Order } from "@/lib/definitions/orders"
import { createAdminClient } from "@/lib/supabase/admin"
import type { ActionResponse } from "@/types/action-response"
import { revalidatePath } from "next/cache"
import { checkOrderDocumentsStatus, uploadOrderFiles } from "."

const parseCurrencyStringToNumber = (value: string | undefined | null): number => {
	if (!value) return 0
	const sanitizedValue = value.replace(/\./g, "").replace(",", ".")
	const numberValue = parseFloat(sanitizedValue)
	return Number.isNaN(numberValue) ? 0 : numberValue
}

interface UpdateOrderParams {
	orderId: string
	customerId: string
	data: EditSimulationData
}

async function updateOrder({ orderId, customerId, data }: UpdateOrderParams): Promise<ActionResponse<null>> {
	const supabaseAdmin = createAdminClient()

	try {
		// 1. Atualizar os dados do cliente
		const customerData: Partial<Customer> = {
			company_name: data.legalName,
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
		}

		const { error: customerError } = await supabaseAdmin.from("customers").update(customerData).eq("id", customerId)
		if (customerError) throw customerError

		// 2. Atualizar os dados do pedido/simulação
		const orderData: Partial<Order> = {
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

		const { error: orderError } = await supabaseAdmin.from("orders").update(orderData).eq("id", orderId)
		if (orderError) throw orderError

		// 3. Build FormData e fazer upload de novos arquivos
		const uploadFormData = new FormData()
		for (const field of documentFields) {
			const fileList = data[field.name as keyof EditSimulationData]
			if (fileList && Array.isArray(fileList) && fileList.length > 0 && fileList[0] instanceof File) {
				uploadFormData.append(field.name, fileList[0])
			}
		}

		const uploadResponse = await uploadOrderFiles(orderId, uploadFormData)
		if (!uploadResponse.success) {
			// Não é um erro crítico, mas registra um aviso
			console.warn("Pedido atualizado, mas houve um erro no upload de novos arquivos:", uploadResponse.message)
		} else if (uploadResponse.data.uploadedCount > 0) {
			// 4. Se houver upload, checa o status dos documentos e atualiza o pedido se necessário
			await checkOrderDocumentsStatus(orderId)
		}

		revalidatePath("/dashboard/orders")

		return {
			success: true,
			message: "Pedido atualizado com sucesso!",
			data: null
		}
	} catch (error) {
		console.error("Erro inesperado em updateOrder:", error)
		if (error instanceof Error) {
			return { success: false, message: `Erro no banco de dados: ${error.message}` }
		}
		return { success: false, message: "Ocorreu um erro inesperado ao salvar as alterações." }
	}
}

export default updateOrder
