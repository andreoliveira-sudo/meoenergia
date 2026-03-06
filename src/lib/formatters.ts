function formatCnpj(cnpj: string): string {
	if (!cnpj) return ""

	const cleaned = cnpj.replace(/\D/g, "")

	if (cleaned.length !== 14) {
		return cnpj
	}

	return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
}

function formatCep(cep: string): string {
	if (!cep) return ""

	const cleaned = cep.replace(/\D/g, "")

	if (cleaned.length !== 8) {
		return cep
	}

	return cleaned.replace(/(\d{5})(\d{3})/, "$1-$2")
}

function formatPhone(phone: string): string {
	if (!phone) return ""

	const cleaned = phone.replace(/\D/g, "")

	if (cleaned.length === 11) {
		return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
	}

	if (cleaned.length === 10) {
		return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3")
	}

	return phone
}

function formatCpf(cpf: string): string {
	if (!cpf) return ""

	const cleaned = cpf.replace(/\D/g, "")

	if (cleaned.length !== 11) {
		return cpf
	}

	return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
}

export { formatCnpj, formatCep, formatPhone, formatCpf }
