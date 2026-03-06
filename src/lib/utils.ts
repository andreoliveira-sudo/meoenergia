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
