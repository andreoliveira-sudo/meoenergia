import { type ClassValue, clsx } from "clsx"
import { format } from "date-fns"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
	if (!dateString) return ""
	const date = new Date(dateString)
	return format(date, "dd/MM/yyyy")
}

export function getFirstAndLastName(name: string | null | undefined): string {
	if (!name) return "N/A"
	const names = name.split(" ").filter(Boolean)
	if (names.length <= 2) return name
	return `${names[0]} ${names[names.length - 1]}`
}

interface PaymentParams {
	rate: number
	numberOfPeriods: number
	presentValue: number
}

/**
 * Calculates the payment for a loan based on constant payments and a constant interest rate.
 * @param params An object containing rate, numberOfPeriods, and presentValue.
 * @returns The payment amount for each period.
 */
export function calculateInstallmentPayment({ rate, numberOfPeriods, presentValue }: PaymentParams): number {
	// If rate is 0, payment is simply the present value divided by the number of periods.
	if (rate === 0) {
		return presentValue / numberOfPeriods
	}

	// The mathematical formula for calculating the payment.
	const payment = (rate * presentValue) / (1 - (1 + rate) ** -numberOfPeriods)

	// Return the absolute value, as payment is an outflow.
	return Math.abs(payment)
}

export function formatCurrency(value: number): string {
	return new Intl.NumberFormat('pt-BR', {
		style: 'currency',
		currency: 'BRL',
	}).format(value)
}

export function isValidCpf(cpf: string): boolean {
	if (typeof cpf !== "string") return false
	cpf = cpf.replace(/[^\d]+/g, "")
	if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false
	const values = cpf.split("").map(el => +el)
	const rest = (count: number) => (values.slice(0, count - 12)
		.reduce((soma, el, index) => (soma + el * (count - index)), 0) * 10) % 11 % 10
	return rest(10) === values[9] && rest(11) === values[10]
}

export function isValidCnpj(cnpj: string): boolean {
	if (!cnpj) return false
	cnpj = cnpj.replace(/[^\d]+/g, "")
	if (cnpj.length !== 14) return false
	let size = cnpj.length - 2
	let numbers = cnpj.substring(0, size)
	const digits = cnpj.substring(size)
	let sum = 0
	let pos = size - 7
	for (let i = size; i >= 1; i--) {
		sum += parseInt(numbers.charAt(size - i)) * pos--
		if (pos < 2) pos = 9
	}
	let result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
	if (result !== parseInt(digits.charAt(0))) return false
	size = size + 1
	numbers = cnpj.substring(0, size)
	sum = 0
	pos = size - 7
	for (let i = size; i >= 1; i--) {
		sum += parseInt(numbers.charAt(size - i)) * pos--
		if (pos < 2) pos = 9
	}
	result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
	if (result !== parseInt(digits.charAt(1))) return false
	return true
}
