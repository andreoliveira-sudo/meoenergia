// Interface para definicao de campos de documento com subtypes
export interface DocumentFieldDef {
	name: string
	label: string
	required: boolean
	subtypes?: string[]
}

// Documentos para Pessoa Fisica
export const documentFieldsPF: DocumentFieldDef[] = [
	{ name: "docIdentificacao", label: "Documentos de identificacao", required: true, subtypes: ["RG", "CNH", "Passaporte"] },
	{ name: "comprovantePropriedade", label: "Comprovante de propriedade do imovel", required: true, subtypes: ["IPTU", "Escritura", "Contrato de compra e venda"] },
	{ name: "contaDeEnergia", label: "Conta de luz", required: true, subtypes: ["Conta de luz"] },
	{ name: "orcamento", label: "Orcamento", required: true, subtypes: ["Orcamento"] },
	{ name: "comprovanteVinculo", label: "Comprovante de vinculo familiar", required: false, subtypes: ["Certidao de casamento", "Declaracao de uniao estavel"] },
	{ name: "outrosDocumentos", label: "Outros documentos solicitados", required: false },
]

// Documentos para Pessoa Juridica
export const documentFieldsPJ: DocumentFieldDef[] = [
	{ name: "docIdentificacao", label: "Documentos de identificacao", required: true, subtypes: ["RG", "CNH", "Passaporte"] },
	{ name: "comprovantePropriedade", label: "Comprovante de propriedade do imovel", required: true, subtypes: ["IPTU", "Escritura", "Contrato de compra e venda"] },
	{ name: "contaDeEnergia", label: "Conta de luz", required: true, subtypes: ["Conta de luz"] },
	{ name: "orcamento", label: "Orcamento", required: true, subtypes: ["Orcamento"] },
	{ name: "balancoDRE2022", label: "Balanco e DRE 2022", required: true },
	{ name: "balancoDRE2023", label: "Balanco e DRE 2023", required: true },
	{ name: "balancoDRE2024", label: "Balanco e DRE 2024", required: true },
	{ name: "balancoDRE2025", label: "Balanco e DRE 2025", required: true },
	{ name: "relacaoFaturamento", label: "Relacao de Faturamento", required: true },
	{ name: "contratoSocial", label: "Contrato Social", required: true },
	{ name: "comprovanteEndereco", label: "Comprovante de Endereco (se diferente da energia)", required: false },
	{ name: "irpfSocios", label: "IRPF dos Socios", required: true },
	{ name: "fotosOperacao", label: "Fotos da Operacao", required: false },
	{ name: "proposta", label: "Proposta Assinada", required: true },
	{ name: "comprovanteVinculo", label: "Comprovante de vinculo familiar", required: false, subtypes: ["Certidao de casamento", "Declaracao de uniao estavel"] },
	{ name: "outrosDocumentos", label: "Outros documentos solicitados", required: false },
]

// Lista unificada — mantida para compatibilidade com codigo legado
// (upload, listagem de arquivos, schemas Zod, etc.)
export const documentFields = [
	{ name: "contaDeEnergia",         label: "Conta de Energia" },
	{ name: "rgCnhSocios",            label: "RG / CNH (Socios ou Titular)" },
	{ name: "comprovantePropriedade", label: "Comprovante de Propriedade do Imovel" },
	{ name: "balancoDRE2022",         label: "Balanco e DRE 2022" },
	{ name: "balancoDRE2023",         label: "Balanco e DRE 2023" },
	{ name: "balancoDRE2024",         label: "Balanco e DRE 2024" },
	{ name: "balancoDRE2025",         label: "Balanco e DRE 2025" },
	{ name: "relacaoFaturamento",     label: "Relacao de Faturamento" },
	{ name: "contratoSocial",         label: "Contrato Social" },
	{ name: "comprovanteEndereco",    label: "Comprovante de Endereco (se diferente da energia)" },
	{ name: "irpfSocios",             label: "IRPF dos Socios" },
	{ name: "fotosOperacao",          label: "Fotos da Operacao" },
	{ name: "proposta",               label: "Proposta Assinada" },
] as const

export default documentFields
