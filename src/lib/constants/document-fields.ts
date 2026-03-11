// Documentos exclusivos para Pessoa Física
export const documentFieldsPF = [
	{ name: "rgCnhSocios",            label: "RG / CNH (Titular)" },
	{ name: "contaDeEnergia",         label: "Conta de Energia (últimos 60 meses)" },
	{ name: "comprovantePropriedade", label: "Comprovante de Propriedade do Imóvel" },
] as const

// Documentos para Pessoa Jurídica
export const documentFieldsPJ = [
	{ name: "rgCnhSocios",            label: "RG / CNH (Sócios ou Titular)" },
	{ name: "contaDeEnergia",         label: "Conta de Energia" },
	{ name: "comprovantePropriedade", label: "Comprovante de Propriedade do Imóvel" },
	{ name: "balancoDRE2022",         label: "Balanço e DRE 2022" },
	{ name: "balancoDRE2023",         label: "Balanço e DRE 2023" },
	{ name: "balancoDRE2024",         label: "Balanço e DRE 2024" },
	{ name: "balancoDRE2025",         label: "Balanço e DRE 2025" },
	{ name: "relacaoFaturamento",     label: "Relação de Faturamento" },
	{ name: "contratoSocial",         label: "Contrato Social" },
	{ name: "comprovanteEndereco",    label: "Comprovante de Endereço (se diferente da energia)" },
	{ name: "irpfSocios",             label: "IRPF dos Sócios" },
	{ name: "fotosOperacao",          label: "Fotos da Operação" },
	{ name: "proposta",               label: "Proposta Assinada" },
] as const

// Lista unificada — mantida para compatibilidade com código legado
// (upload, listagem de arquivos, schemas Zod, etc.)
export const documentFields = [
	{ name: "contaDeEnergia",         label: "Conta de Energia" },
	{ name: "rgCnhSocios",            label: "RG / CNH (Sócios ou Titular)" },
	{ name: "comprovantePropriedade", label: "Comprovante de Propriedade do Imóvel" },
	{ name: "balancoDRE2022",         label: "Balanço e DRE 2022" },
	{ name: "balancoDRE2023",         label: "Balanço e DRE 2023" },
	{ name: "balancoDRE2024",         label: "Balanço e DRE 2024" },
	{ name: "balancoDRE2025",         label: "Balanço e DRE 2025" },
	{ name: "relacaoFaturamento",     label: "Relação de Faturamento" },
	{ name: "contratoSocial",         label: "Contrato Social" },
	{ name: "comprovanteEndereco",    label: "Comprovante de Endereço (se diferente da energia)" },
	{ name: "irpfSocios",             label: "IRPF dos Sócios" },
	{ name: "fotosOperacao",          label: "Fotos da Operação" },
	{ name: "proposta",               label: "Proposta Assinada" },
] as const

export default documentFields
