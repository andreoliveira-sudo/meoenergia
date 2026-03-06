// masks.ts
function maskCnpj(value: string) {
	return value
		.replace(/\D/g, "")
		.replace(/(\d{2})(\d)/, "$1.$2")
		.replace(/(\d{3})(\d)/, "$1.$2")
		.replace(/(\d{3})(\d)/, "$1/$2")
		.replace(/(\d{4})(\d)/, "$1-$2")
		.replace(/(-\d{2})\d+?$/, "$1")
}

function maskPhone(value: string) {
	let v = value.replace(/\D/g, "")
	v = v.replace(/^(\d{2})(\d)/g, "($1) $2")
	if (v.length > 13) {
		v = v.replace(/(\d{5})(\d)/, "$1-$2")
	} else {
		v = v.replace(/(\d{4})(\d)/, "$1-$2")
	}
	return v.slice(0, 15)
}

function maskCep(value: string) {
	return value
		.replace(/\D/g, "")
		.replace(/(\d{5})(\d)/, "$1-$2")
		.replace(/(-\d{3})\d+?$/, "$1")
}

function maskCpf(value: string) {
	return value
		.replace(/\D/g, "")
		.replace(/(\d{3})(\d)/, "$1.$2")
		.replace(/(\d{3})(\d)/, "$1.$2")
		.replace(/(\d{3})(\d)/, "$1-$2")
		.replace(/(-\d{2})\d+?$/, "$1")
}

function maskDate(value: string) {
	return value
		.replace(/\D/g, "")
		.replace(/(\d{2})(\d)/, "$1/$2")
		.replace(/(\d{2})(\d)/, "$1/$2")
		.replace(/(\d{4})\d+?$/, "$1")
}

const numberFormatter = new Intl.NumberFormat("pt-BR", {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2
})

// Para input do usuário (digita e vai formatando)
const maskNumber = (value: string, maxLength: number = 9) => {
	let justDigits = value.replace(/\D/g, "")

	if (justDigits.length > maxLength) {
		justDigits = justDigits.slice(0, maxLength)
	}

	const numberValue = parseFloat(justDigits) / 100

	if (Number.isNaN(numberValue)) return ""

	return numberFormatter.format(numberValue)
}

// NOVA: Para exibir valores do banco (que já tem casas decimais)
const formatNumberFromDatabase = (value: number | null | undefined): string => {
	if (value === null || value === undefined) return "0,00"

	return numberFormatter.format(value)
}

// NOVA: Para converter string formatada para number (banco NUMERIC)
const parseFormattedNumber = (value: string | undefined | null): number => {
	if (!value) return 0

	// Remove pontos de milhar e substitui vírgula por ponto
	const sanitizedValue = value.replace(/\./g, "").replace(",", ".")
	const numberValue = parseFloat(sanitizedValue)

	return Number.isNaN(numberValue) ? 0 : numberValue
}

export { maskCnpj, maskPhone, maskCep, maskCpf, maskDate, maskNumber, formatNumberFromDatabase, parseFormattedNumber }

// === NOVAS MÁSCARAS (CORE-01) ===

function maskIE(value: string): string {
	if (!value) return ''
	return value.replace(/\D/g, '').slice(0, 18)
}

function unmask(value: string): string {
	return value.replace(/\D/g, '')
}

function applyMask(value: string, type: 'cpf' | 'cnpj' | 'ie' | 'phone' | 'cep'): string {
	switch (type) {
		case 'cpf': return maskCpf(value)
		case 'cnpj': return maskCnpj(value)
		case 'ie': return maskIE(value)
		case 'phone': return maskPhone(value)
		case 'cep': return maskCep(value)
		default: return value
	}
}

export { maskIE, unmask, applyMask }

