// ========================
// TIPOS DE ENTRADA/SAÍDA
// ========================

export interface SimulationInput {
    monthlyConsumption: number // kWh
    energyRate: number // R$/kWh
    systemSize?: number // kWp (opcional, será calculado)
    installationCost?: number // R$ (opcional)
}

export interface SimulationOutput {
    systemSize: number // kWp recomendado
    annualGeneration: number // kWh/ano
    annualSavings: number // R$/ano
    monthlyGeneration: number // kWh/mês
    monthlySavings: number // R$/mês
    paybackMonths: number // meses
    paybackYears: number // anos
    co2Avoided: number // kg CO2/ano
}

// ========================
// CONSTANTES
// ========================

const SOLAR_HOURS_PER_DAY = 4.5 // Horas de sol pico médio Brasil
const KWH_PER_KWP_YEAR = SOLAR_HOURS_PER_DAY * 365 // ~1642 kWh/kWp/ano
const CO2_PER_KWH = 0.084 // kg CO2 evitado por kWh
const DEFAULT_COST_PER_KWP = 5000 // R$/kWp instalado

// ========================
// FUNÇÃO PRINCIPAL
// ========================

export function calculateSimulation(input: SimulationInput): SimulationOutput {
    const { monthlyConsumption, energyRate, systemSize, installationCost } = input

    // Consumo anual
    const annualConsumption = monthlyConsumption * 12

    // Tamanho do sistema (se não fornecido)
    const calculatedSystemSize = systemSize ?? annualConsumption / KWH_PER_KWP_YEAR

    // Geração anual
    const annualGeneration = calculatedSystemSize * KWH_PER_KWP_YEAR

    // Economia
    const annualSavings = annualGeneration * energyRate
    const monthlySavings = annualSavings / 12

    // Custo de instalação
    const cost = installationCost ?? calculatedSystemSize * DEFAULT_COST_PER_KWP

    // Payback
    const paybackMonths = Math.ceil(cost / monthlySavings)
    const paybackYears = paybackMonths / 12

    // CO2 evitado
    const co2Avoided = annualGeneration * CO2_PER_KWH

    return {
        systemSize: Math.round(calculatedSystemSize * 100) / 100,
        annualGeneration: Math.round(annualGeneration),
        annualSavings: Math.round(annualSavings * 100) / 100,
        monthlyGeneration: Math.round(annualGeneration / 12),
        monthlySavings: Math.round(monthlySavings * 100) / 100,
        paybackMonths,
        paybackYears: Math.round(paybackYears * 10) / 10,
        co2Avoided: Math.round(co2Avoided),
    }
}
