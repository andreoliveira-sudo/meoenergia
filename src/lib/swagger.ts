import { createSwaggerSpec } from "next-swagger-doc"

export const getApiDocs = async () => {
    const spec = createSwaggerSpec({
        apiFolder: "src/app/api",
        definition: {
            openapi: "3.0.0",
            info: {
                title: "MEO ERP Integration API",
                version: "2.1",
                description: `
**API de Integração MEO Energia**

Esta API permite que parceiros e integradores gerenciem Pedidos e Dados da API de forma programática.

## 🔐 Autenticação
Todas as requisições devem incluir o header \`x-api-key\` com a chave gerada no painel do desenvolvedor.

**Exemplo:** 
\`\`\`
x-api-key: meo_sk_1234567890abcdef1234567890abcdef
\`\`\`

## 📋 Scopes (Permissões)
Cada chave de API possui scopes específicos que determinam quais endpoints podem ser acessados:

- \`orders:read\` - Ler pedidos
- \`orders:write\` - Criar pedidos  
- \`data:read\` - Ler dados da chave
- \`data:write\` - Atualizar dados da chave

## 📊 Rate Limiting
- Máximo de 100 requisições por minuto por chave
- Webhooks: 1 requisição por segundo

## 🔔 Webhooks

### Visão Geral
Quando configurada uma URL de webhook, sua aplicação receberá notificações automáticas via POST sempre que eventos relevantes ocorrerem nos pedidos vinculados à sua chave de API.

### Eventos Disponíveis

#### \`order.status.{status}\`
Disparado quando o status de um pedido é alterado.

**Exemplo:** \`order.status.analysis_approved\`, \`order.status.finished\`, \`order.status.canceled\`

**Quando ocorre:** 
- Clique manual no painel administrativo
- Aprovação automática após análise de documentos
- Reprovação por inconsistência cadastral
- Atualização via integração parceiro

#### \`order.updated\`
Disparado quando os dados de um pedido são atualizados.

**Quando ocorre:**
- Edição da simulação (valores, prazos)
- Upload de novos documentos
- Atualização de dados cadastrais

### Formato do Payload
\`\`\`json
{
  "event": "order.status.analysis_approved",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "kdi": "KDI-2024-00123",
    "status": "analysis_approved",
    "customers": {
      "type": "pf",
      "document": "123.456.789-10",
      "name": "João Silva"
    },
    "sellers": {
      "name": "Patricia Verena"
    },
    "simulation": {
      "investment_value": 36000.00,
      "total_investment": 41990.40,
      "installments": [
        {
          "term_months": 60,
          "interest_rate_percent": 1.68,
          "monthly_installment": 978.45
        }
      ]
    }
  }
}
\`\`\`
 
### Garantias de Entrega
- Timeout de 10 segundos por requisição 
- Recomendamos implementar idempotência no seu endpoint

## 📊 Status dos Pedidos

### Status Disponíveis
| Status | Descrição | Próximos Status Possíveis |
|--------|-----------|---------------------------|
| \`analysis_pending\` | **Ag. Análise** - Pedido criado, aguardando análise inicial | \`analysis_approved\`, \`analysis_rejected\`, \`documents_pending\` |
| \`analysis_approved\` | **Aprovado** - Pedido aprovado na análise inicial | \`sending_distributor_invoice\`, \`payment_distributor\` |
| \`analysis_rejected\` | **Reprovado** - Pedido reprovado na análise | Terminal |
| \`documents_pending\` | **Ag. Documentos** - Cliente precisa enviar documentação | \`docs_analysis\`, \`canceled\` |
| \`docs_analysis\` | **Análise Docs** - Verificando documentação enviada | \`analysis_approved\`, \`analysis_rejected\`, \`documents_pending\` |
| \`sending_distributor_invoice\` | **Envio NF Distribuidora** - Aguardando/envio nota fiscal para distribuidora | \`payment_distributor\` |
| \`payment_distributor\` | **Pgto. Distribuidora** - Processando pagamento à distribuidora | \`access_opinion\` |
| \`access_opinion\` | **Parecer de Acesso** - Aguardando parecer de acesso da concessionária | \`initial_payment_integrator\`, \`finished\` |
| \`initial_payment_integrator\` | **Pagt inicial Integrador** - Pagamento inicial ao integrador | \`final_payment_integrator\` |
| \`final_payment_integrator\` | **Pagt Final Integrador** - Pagamento final ao integrador | \`finished\` |
| \`finished\` | **Finalizado** - Projeto concluído com sucesso | Terminal |
| \`canceled\` | **Cancelado** - Pedido cancelado pelo cliente/sistema | Terminal |

### Eventos de Webhook por Status
Cada mudança para um destes status dispara o evento \`order.status.{status}\`:

- \`order.status.analysis_pending\`
- \`order.status.analysis_approved\`
- \`order.status.analysis_rejected\`
- \`order.status.documents_pending\`
- \`order.status.docs_analysis\`
- \`order.status.sending_distributor_invoice\`
- \`order.status.payment_distributor\`
- \`order.status.access_opinion\`
- \`order.status.initial_payment_integrator\`
- \`order.status.final_payment_integrator\`
- \`order.status.finished\`
- \`order.status.canceled\`

### Observações Importantes
- **Webhooks são "fire and forget"**: Enviamos uma única tentativa, sem retentativas
- **Recomendação**: Implemente um endpoint que responda 2xx rapidamente e processe o webhook de forma assíncrona
`
            },
            components: {
                securitySchemes: {
                    ApiKeyAuth: {
                        type: "apiKey",
                        in: "header",
                        name: "x-api-key",
                        description: "Chave de API gerada no painel do desenvolvedor"
                    }
                },
                schemas: {
                    Error: {
                        type: "object",
                        properties: {
                            error: {
                                type: "object",
                                properties: {
                                    code: { 
                                        type: "string",
                                        example: "VALIDATION_ERROR"
                                    },
                                    message: { 
                                        type: "string",
                                        example: "CPF inválido. Deve conter 11 dígitos."
                                    }
                                }
                            }
                        }
                    },
                    OrderStatus: {
                        type: "string",
                        enum: [
                            "analysis_pending",
                            "analysis_approved",
                            "analysis_rejected",
                            "documents_pending",
                            "docs_analysis",
                            "sending_distributor_invoice",
                            "payment_distributor",
                            "access_opinion",
                            "initial_payment_integrator",
                            "final_payment_integrator",
                            "finished",
                            "canceled"
                        ],
                        description: "Status atual do pedido",
                        "x-enum-descriptions": {
                            "analysis_pending": "Ag. Análise - Pedido criado, aguardando análise inicial",
                            "analysis_approved": "Aprovado - Pedido aprovado na análise inicial",
                            "analysis_rejected": "Reprovado - Pedido reprovado na análise",
                            "documents_pending": "Ag. Documentos - Cliente precisa enviar documentação",
                            "docs_analysis": "Análise Docs - Verificando documentação enviada",
                            "sending_distributor_invoice": "Envio NF Distribuidora - Aguardando/envio nota fiscal para distribuidora",
                            "payment_distributor": "Pgto. Distribuidora - Processando pagamento à distribuidora",
                            "access_opinion": "Parecer de Acesso - Aguardando parecer de acesso da concessionária",
                            "initial_payment_integrator": "Pagt inicial Integrador - Pagamento inicial ao integrador",
                            "final_payment_integrator": "Pagt Final Integrador - Pagamento final ao integrador",
                            "finished": "Finalizado - Projeto concluído com sucesso",
                            "canceled": "Cancelado - Pedido cancelado pelo cliente/sistema"
                        }
                    },
                    WebhookEventType: {
                        type: "string",
                        enum: [
                            "order.updated",
                            "order.status.analysis_pending",
                            "order.status.analysis_approved",
                            "order.status.analysis_rejected",
                            "order.status.documents_pending",
                            "order.status.docs_analysis",
                            "order.status.sending_distributor_invoice",
                            "order.status.payment_distributor",
                            "order.status.access_opinion",
                            "order.status.initial_payment_integrator",
                            "order.status.final_payment_integrator",
                            "order.status.finished",
                            "order.status.canceled"
                        ],
                        description: "Tipo de evento de webhook"
                    },
                    SimulationInstallment: {
                        type: "object",
                        properties: {
                            term_months: { 
                                type: "integer", 
                                description: "Prazo em meses",
                                example: 60 
                            },
                            interest_rate_percent: { 
                                type: "number", 
                                description: "Taxa de juros mensal em porcentagem",
                                example: 1.68 
                            },
                            monthly_installment: { 
                                type: "number", 
                                description: "Valor da parcela mensal em R$",
                                example: 978.45 
                            }
                        }
                    },
                    SimulationData: {
                        type: "object",
                        description: "Dados de simulação financeira com opções de parcelamento. **PF:** prazos disponíveis de 24, 30, 36, 48, 60, 72, 84 e 96 meses. **PJ:** prazos disponíveis de 24, 36, 48 e 60 meses com taxas e tarifas específicas para pessoa jurídica.",
                        properties: {
                            investment_value: { 
                                type: "number", 
                                description: "Valor do investimento (equipamento + mão de obra + outros)",
                                example: 36000.00 
                            },
                            management_fee_percent: { 
                                type: "number", 
                                description: "Percentual da taxa de gestão (PF: 8%, PJ: 4%)",
                                example: 8 
                            },
                            management_fee_value: { 
                                type: "number", 
                                description: "Valor da taxa de gestão em R$",
                                example: 2880.00 
                            },
                            service_fee_percent: { 
                                type: "number", 
                                description: "Percentual da taxa de contratação",
                                example: 8 
                            },
                            service_fee_value: { 
                                type: "number", 
                                description: "Valor da taxa de contratação em R$",
                                example: 3110.40 
                            },
                            total_investment: { 
                                type: "number", 
                                description: "Valor total do investimento (incluindo taxas)",
                                example: 41990.40 
                            },
                            installments: {
                                type: "array",
                                description: "Opções de parcelamento disponíveis conforme tipo de cliente",
                                items: { $ref: "#/components/schemas/SimulationInstallment" }
                            }
                        }
                    },
                    CustomerAddress: {
                        type: "object",
                        properties: {
                            postal_code: { 
                                type: "string", 
                                description: "CEP do endereço",
                                example: "01234567" 
                            },
                            street: { 
                                type: "string", 
                                description: "Logradouro",
                                example: "Rua A" 
                            },
                            number: { 
                                type: "string", 
                                description: "Número do endereço",
                                example: "123" 
                            },
                            complement: { 
                                type: "string", 
                                description: "Complemento",
                                example: "Apto 45" 
                            },
                            neighborhood: { 
                                type: "string", 
                                description: "Bairro",
                                example: "Centro" 
                            },
                            city: { 
                                type: "string", 
                                description: "Cidade",
                                example: "São Paulo" 
                            },
                            state: { 
                                type: "string", 
                                description: "UF",
                                example: "SP" 
                            }
                        }
                    },
                    CustomerPartner: {
                        type: "object",
                        properties: {
                            contact_name: { 
                                type: "string", 
                                description: "Nome do contato do parceiro",
                                example: "Ataniel Prospero de Sousa" 
                            },
                            legal_business_name: { 
                                type: "string", 
                                description: "Razão social do parceiro",
                                example: "43.108.124 ATANIEL PROSPERO DE SOUSA" 
                            }
                        }
                    },
                    CustomerResponse: {
                        type: "object",
                        properties: {
                            type: { 
                                type: "string", 
                                enum: ["pf", "pj"], 
                                description: "Tipo de cliente: PF (Pessoa Física) ou PJ (Pessoa Jurídica)",
                                example: "pf" 
                            },
                            document: { 
                                type: "string", 
                                description: "Documento formatado conforme o tipo",
                                example: "123.456.789-10" 
                            },
                            name: { 
                                type: "string", 
                                description: "Nome do cliente (nome completo para PF, razão social para PJ)",
                                example: "João Silva" 
                            },
                            cpf: { 
                                type: "string", 
                                description: "CPF do cliente (apenas para PF)",
                                example: "123.456.789-10" 
                            },
                            individual_name: { 
                                type: "string", 
                                description: "Nome completo do cliente (apenas para PF)",
                                example: "João Silva" 
                            },
                            marital_status: { 
                                type: "string", 
                                enum: ["single", "married", "divorced", "widowed", "other"],
                                description: "Estado civil (apenas para PF)",
                                example: "married" 
                            },
                            birth_date: { 
                                type: "string", 
                                format: "date",
                                description: "Data de nascimento (apenas para PF)",
                                example: "1985-05-15" 
                            },
                            gender: { 
                                type: "string", 
                                enum: ["M", "F", "other"],
                                description: "Gênero (apenas para PF)",
                                example: "M" 
                            },
                            occupation: { 
                                type: "string", 
                                description: "Profissão/ocupação (apenas para PF)",
                                example: "Engenheiro" 
                            },
                            cnpj: { 
                                type: "string", 
                                description: "CNPJ do cliente (apenas para PJ)",
                                example: "12.345.678/0001-95" 
                            },
                            company_name: { 
                                type: "string", 
                                description: "Razão social da empresa (apenas para PJ)",
                                example: "Empresa Exemplo LTDA" 
                            },
                            trading_name: { 
                                type: "string", 
                                description: "Nome fantasia (apenas para PJ)",
                                example: "Empresa Exemplo" 
                            },
                            state_registration: { 
                                type: "string", 
                                description: "Inscrição Estadual (apenas para PJ)",
                                example: "123.456.789.112" 
                            },
                            incorporation_date: { 
                                type: "string", 
                                format: "date",
                                description: "Data de constituição (apenas para PJ)",
                                example: "2010-01-15" 
                            },
                            annual_revenue: { 
                                type: "number", 
                                description: "Faturamento anual em R$ (apenas para PJ)",
                                example: 1000000.00 
                            },
                            contact_name: { 
                                type: "string", 
                                description: "Nome do contato principal",
                                example: "João Silva" 
                            },
                            contact_email: { 
                                type: "string", 
                                format: "email", 
                                description: "Email de contato",
                                example: "joao@email.com" 
                            },
                            contact_phone: { 
                                type: "string", 
                                description: "Telefone de contato",
                                example: "(11) 99999-9999" 
                            },
                            address: { $ref: "#/components/schemas/CustomerAddress" },
                            partner: { 
                                allOf: [{ $ref: "#/components/schemas/CustomerPartner" }],
                                nullable: true 
                            }
                        }
                    },
                    SellerResponse: {
                        type: "object",
                        properties: {
                            name: { 
                                type: "string", 
                                description: "Nome do vendedor",
                                example: "Patricia Verena" 
                            }
                        }
                    },
                    OrderResponse: {
                        type: "object",
                        properties: {
                            id: { 
                                type: "string", 
                                format: "uuid", 
                                description: "ID único do pedido",
                                example: "550e8400-e29b-41d4-a716-446655440000" 
                            },
                            kdi: { 
                                type: "string", 
                                description: "Código KDI único do pedido",
                                example: "KDI-2024-00123" 
                            },
                            system_power: { 
                                type: "number", 
                                description: "Potência do sistema em kWp",
                                example: 7.5 
                            },
                            current_consumption: { 
                                type: "number", 
                                description: "Consumo médio mensal em kWh",
                                example: 500 
                            },
                            connection_voltage: { 
                                type: "string", 
                                description: "Tensão de conexão",
                                example: "220" 
                            },
                            equipment_value: { 
                                type: "number", 
                                description: "Valor dos equipamentos em R$",
                                example: 25000.00 
                            },
                            labor_value: { 
                                type: "number", 
                                description: "Valor da mão de obra em R$",
                                example: 5000.00 
                            },
                            other_costs: { 
                                type: "number", 
                                description: "Outros custos em R$",
                                example: 1000.00 
                            },
                            created_at: { 
                                type: "string", 
                                format: "date-time", 
                                description: "Data de criação do pedido",
                                example: "2024-01-15T10:30:00Z" 
                            },
                            updated_at: { 
                                type: "string", 
                                format: "date-time", 
                                description: "Data da última atualização",
                                example: "2024-01-15T10:35:00Z" 
                            },
                            status: { 
                                $ref: "#/components/schemas/OrderStatus"
                            },
                            payment_day: { 
                                type: "integer", 
                                minimum: 1,
                                maximum: 31,
                                description: "Dia preferencial para pagamento das parcelas",
                                example: 15 
                            },
                            financing_term: { 
                                type: "integer", 
                                description: "Prazo de financiamento em meses. PF: [24, 30, 36, 48, 60, 72, 84, 96]. PJ: [24, 36, 48, 60].",
                                example: 60 
                            },
                            monthly_bill_value: { 
                                type: "number", 
                                description: "Valor médio da conta de energia em R$",
                                example: 450.00 
                            },
                            notes: { 
                                type: "string", 
                                description: "Observações adicionais",
                                example: "Cliente preferiu pagamento à vista" 
                            },
                            customers: { $ref: "#/components/schemas/CustomerResponse" },
                            sellers: { 
                                allOf: [{ $ref: "#/components/schemas/SellerResponse" }],
                                nullable: true 
                            },
                            simulation: { 
                                allOf: [{ $ref: "#/components/schemas/SimulationData" }],
                                description: "Dados de simulação financeira. Disponível para PF e PJ com prazos e taxas específicos por tipo de cliente.",
                                nullable: true 
                            }
                        }
                    },
                    CreateOrderRequest: {
                        type: "object",
                        required: [
                            "document", "name", "email", "phone", "postal_code", "street", 
                            "number", "neighborhood", "city", "state", "current_consumption",
                            "monthly_bill_value", "system_power", "equipment_value", "labor_value"
                        ],
                        properties: {
                            document: { 
                                type: "string", 
                                description: "CPF (11 dígitos) ou CNPJ (14 dígitos), com ou sem formatação. O tipo de cliente (PF/PJ) é determinado automaticamente.",
                                example: "123.456.789-09" 
                            },
                            name: { 
                                type: "string", 
                                description: "Nome completo (para PF) ou Razão Social (para PJ)",
                                example: "João Silva" 
                            },
                            email: { 
                                type: "string", 
                                format: "email",
                                description: "Email para contato",
                                example: "joao@email.com" 
                            },
                            phone: { 
                                type: "string", 
                                description: "Telefone para contato",
                                example: "(11) 99999-9999" 
                            },
                            postal_code: { 
                                type: "string", 
                                description: "CEP do endereço",
                                example: "01234-567" 
                            },
                            street: { 
                                type: "string", 
                                description: "Logradouro",
                                example: "Rua A" 
                            },
                            number: { 
                                type: "string", 
                                description: "Número do endereço",
                                example: "123" 
                            },
                            complement: { 
                                type: "string", 
                                description: "Complemento do endereço (opcional)",
                                example: "Sala 101" 
                            },
                            neighborhood: { 
                                type: "string", 
                                description: "Bairro",
                                example: "Centro" 
                            },
                            city: { 
                                type: "string", 
                                description: "Cidade",
                                example: "São Paulo" 
                            },
                            state: { 
                                type: "string", 
                                description: "Estado (UF)",
                                example: "SP" 
                            },
                            current_consumption: { 
                                type: "number", 
                                description: "Consumo médio mensal em kWh",
                                example: 500 
                            },
                            monthly_bill_value: { 
                                type: "number", 
                                description: "Valor médio da conta de energia em R$",
                                example: 450.00 
                            },
                            system_power: { 
                                type: "number", 
                                description: "Potência do sistema em kWp",
                                example: 7.5 
                            },
                            equipment_value: { 
                                type: "number", 
                                description: "Valor dos equipamentos em R$",
                                example: 25000.00 
                            },
                            labor_value: { 
                                type: "number", 
                                description: "Valor da mão de obra em R$",
                                example: 5000.00 
                            },
                            other_costs: { 
                                type: "number", 
                                description: "Outros custos em R$ (opcional)",
                                example: 1000.00 
                            },
                            payment_day: { 
                                type: "integer", 
                                minimum: 1,
                                maximum: 31,
                                description: "Dia preferencial para pagamento (opcional)",
                                example: 15 
                            },
                            financing_term: { 
                                type: "integer", 
                                description: "Prazo de financiamento em meses. PF: [24, 30, 36, 48, 60, 72, 84, 96]. PJ: [24, 36, 48, 60]. (opcional)",
                                example: 60 
                            },
                            notes: { 
                                type: "string", 
                                description: "Observações adicionais (opcional)",
                                example: "Cliente com restrição de horário para instalação" 
                            },
                            // Campos exclusivos PF
                            marital_status: { 
                                type: "string", 
                                enum: ["single", "married", "divorced", "widowed", "separated"],
                                description: "Estado civil (apenas para PF, opcional)",
                                example: "married" 
                            },
                            birth_date: { 
                                type: "string", 
                                format: "date",
                                description: "Data de nascimento no formato YYYY-MM-DD (apenas para PF, opcional)",
                                example: "1985-05-15" 
                            },
                            gender: { 
                                type: "string", 
                                enum: ["M", "F", "other"],
                                description: "Gênero (apenas para PF, opcional)",
                                example: "M" 
                            },
                            occupation: { 
                                type: "string", 
                                description: "Profissão/ocupação, mínimo 3 caracteres (apenas para PF, opcional)",
                                example: "Engenheiro" 
                            },
                            // Campos exclusivos PJ
                            company_name: { 
                                type: "string", 
                                description: "Razão social da empresa (apenas para PJ, opcional se fornecido em name)",
                                example: "Empresa Exemplo LTDA" 
                            },
                            contact_name: { 
                                type: "string", 
                                description: "Nome do responsável/contato na empresa (apenas para PJ, opcional)",
                                example: "Carlos Souza" 
                            },
                            trading_name: { 
                                type: "string", 
                                description: "Nome fantasia (apenas para PJ, opcional)",
                                example: "Empresa Exemplo" 
                            },
                            incorporation_date: { 
                                type: "string", 
                                format: "date",
                                description: "Data de constituição no formato YYYY-MM-DD (apenas para PJ, opcional)",
                                example: "2010-01-15" 
                            }
                        }
                    },
                    CreateOrderResponse: {
                        type: "object",
                        properties: {
                            success: { 
                                type: "boolean", 
                                description: "Indica se a operação foi bem-sucedida",
                                example: true 
                            },
                            message: { 
                                type: "string", 
                                description: "Mensagem descritiva do resultado",
                                example: "Pedido criado com sucesso para Pessoa Física" 
                            },
                            data: {
                                type: "object",
                                description: "Dados do pedido criado com simulação financeira",
                                properties: {
                                    id: { 
                                        type: "string", 
                                        format: "uuid", 
                                        description: "ID único do pedido criado",
                                        example: "550e8400-e29b-41d4-a716-446655440000" 
                                    },
                                    kdi: { 
                                        type: "string", 
                                        description: "Código KDI do pedido",
                                        example: "KDI-2024-00123" 
                                    },
                                    status: { 
                                        type: "string", 
                                        description: "Status inicial do pedido",
                                        example: "analysis_pending" 
                                    },
                                    customer_type: { 
                                        type: "string", 
                                        enum: ["pf", "pj"], 
                                        description: "Tipo de cliente identificado",
                                        example: "pf" 
                                    },
                                    document: { 
                                        type: "string", 
                                        description: "Documento normalizado (apenas dígitos)",
                                        example: "12345678909" 
                                    },
                                    simulation: { 
                                        allOf: [{ $ref: "#/components/schemas/SimulationData" }],
                                        description: "Simulação financeira gerada automaticamente para PF e PJ",
                                        nullable: true 
                                    },
                                    created_at: { 
                                        type: "string", 
                                        format: "date-time", 
                                        description: "Data de criação",
                                        example: "2024-01-15T10:30:00Z" 
                                    }
                                }
                            }
                        }
                    },
                    OrdersListResponse: {
                        type: "object",
                        properties: {
                            data: {
                                type: "array",
                                description: "Lista de pedidos",
                                items: { $ref: "#/components/schemas/OrderResponse" }
                            },
                            meta: {
                                type: "object",
                                description: "Metadados da paginação",
                                properties: {
                                    page: { 
                                        type: "integer", 
                                        description: "Página atual",
                                        example: 1 
                                    },
                                    limit: { 
                                        type: "integer", 
                                        description: "Itens por página",
                                        example: 20 
                                    },
                                    total: { 
                                        type: "integer", 
                                        description: "Total de itens",
                                        example: 45 
                                    },
                                    totalPages: { 
                                        type: "integer", 
                                        description: "Total de páginas",
                                        example: 3 
                                    }
                                }
                            }
                        }
                    },
                    OrderDetailResponse: {
                        type: "object",
                        properties: {
                            data: { 
                                $ref: "#/components/schemas/OrderResponse",
                                description: "Dados completos do pedido"
                            }
                        }
                    },
                    WebhookPayload: {
                        type: "object",
                        description: "Payload enviado para URLs de webhook configuradas",
                        properties: {
                            event: { 
                                $ref: "#/components/schemas/WebhookEventType",
                                description: "Tipo de evento que disparou o webhook"
                            },
                            timestamp: { 
                                type: "string", 
                                format: "date-time", 
                                description: "Data e hora do evento em UTC",
                                example: "2024-01-15T10:30:00Z" 
                            },
                            data: { 
                                $ref: "#/components/schemas/OrderResponse",
                                description: "Dados completos do pedido no momento do evento. Inclui simulação financeira tanto para PF quanto para PJ, com prazos e taxas específicos por tipo de cliente." 
                            }
                        }
                    },
                    ApiKeyData: {
                        type: "object",
                        properties: {
                            id: { 
                                type: "string", 
                                format: "uuid", 
                                description: "ID da chave de API",
                                example: "550e8400-e29b-41d4-a716-446655440000" 
                            },
                            name: { 
                                type: "string", 
                                description: "Nome da chave de API",
                                example: "Integração Loja Online" 
                            },
                            key_prefix: { 
                                type: "string", 
                                description: "Prefixo da chave de API",
                                example: "meo_sk_1234567890abcdef" 
                            },
                            scopes: { 
                                type: "array", 
                                description: "Permissões da chave",
                                items: { type: "string" },
                                example: ["orders:read", "orders:write"] 
                            },
                            status: { 
                                type: "string", 
                                enum: ["active", "inactive"], 
                                description: "Status da chave",
                                example: "active" 
                            },
                            last_used_at: { 
                                type: "string", 
                                format: "date-time", 
                                description: "Data do último uso",
                                example: "2024-01-15T10:30:00Z" 
                            },
                            created_at: { 
                                type: "string", 
                                format: "date-time", 
                                description: "Data de criação",
                                example: "2024-01-10T14:20:00Z" 
                            },
                            webhook_url: { 
                                type: "string", 
                                format: "uri", 
                                description: "URL configurada para webhooks",
                                example: "https://seu-dominio.com/webhook" 
                            },
                            partner: {
                                type: "object",
                                description: "Parceiro associado à chave",
                                properties: {
                                    id: { 
                                        type: "string", 
                                        format: "uuid", 
                                        example: "550e8400-e29b-41d4-a716-446655440001" 
                                    },
                                    name: { 
                                        type: "string", 
                                        example: "Parceiro Exemplo" 
                                    }
                                }
                            },
                            internal_manager: {
                                type: "object",
                                description: "Gestor interno responsável",
                                properties: {
                                    id: { 
                                        type: "string", 
                                        format: "uuid", 
                                        example: "550e8400-e29b-41d4-a716-446655440002" 
                                    },
                                    name: { 
                                        type: "string", 
                                        example: "Maria Silva" 
                                    },
                                    email: { 
                                        type: "string", 
                                        format: "email", 
                                        example: "maria@empresa.com" 
                                    }
                                }
                            }
                        }
                    },
                    UpdateWebhookRequest: {
                        type: "object",
                        required: ["webhook_url"],
                        properties: {
                            webhook_url: { 
                                type: "string", 
                                description: "URL para receber webhooks. Envie string vazia para remover.",
                                example: "https://seu-dominio.com/webhook" 
                            }
                        }
                    }
                }
            },
            security: [{ ApiKeyAuth: [] }],
            paths: {
                "/api/v1/orders": {
                    get: {
                        summary: "Listar Pedidos",
                        description: "Lista todos os pedidos associados à chave de API atual. Cada chave só pode ver os pedidos que ela mesma criou. Inclui simulação financeira para PF e PJ. Requer scope `orders:read`.",
                        tags: ["Pedidos"],
                        parameters: [
                            {
                                name: "page",
                                in: "query",
                                schema: { 
                                    type: "integer", 
                                    default: 1,
                                    minimum: 1 
                                },
                                description: "Número da página"
                            },
                            {
                                name: "limit",
                                in: "query",
                                schema: { 
                                    type: "integer", 
                                    default: 20,
                                    minimum: 1,
                                    maximum: 100 
                                },
                                description: "Quantidade de itens por página"
                            }
                        ],
                        responses: {
                            "200": {
                                description: "Lista de pedidos recuperada com sucesso",
                                content: {
                                    "application/json": {
                                        schema: { $ref: "#/components/schemas/OrdersListResponse" },
                                        example: {
                                            data: [
                                                {
                                                    id: "550e8400-e29b-41d4-a716-446655440000",
                                                    kdi: "KDI-2024-00123",
                                                    system_power: 7.5,
                                                    current_consumption: 500,
                                                    connection_voltage: "220",
                                                    equipment_value: 25000.00,
                                                    labor_value: 5000.00,
                                                    other_costs: 1000.00,
                                                    created_at: "2024-01-15T10:30:00Z",
                                                    updated_at: "2024-01-15T10:35:00Z",
                                                    status: "analysis_pending",
                                                    payment_day: 15,
                                                    financing_term: 60,
                                                    monthly_bill_value: 450.00,
                                                    notes: "",
                                                    customers: {
                                                        type: "pf",
                                                        document: "12345678910",
                                                        name: "João Silva",
                                                        cpf: "12345678910",
                                                        individual_name: "João Silva",
                                                        marital_status: "married",
                                                        birth_date: "1985-05-15",
                                                        gender: "M",
                                                        occupation: "Engenheiro",
                                                        contact_name: "João Silva",
                                                        contact_email: "joao@email.com",
                                                        contact_phone: "11999999999",
                                                        address: {
                                                            postal_code: "01234567",
                                                            street: "Rua A",
                                                            number: "123",
                                                            complement: "",
                                                            neighborhood: "Centro",
                                                            city: "São Paulo",
                                                            state: "SP"
                                                        },
                                                        partner: null
                                                    },
                                                    sellers: { name: "Patricia Verena" },
                                                    simulation: {
                                                        investment_value: 31000.00,
                                                        management_fee_percent: 8,
                                                        management_fee_value: 2480.00,
                                                        service_fee_percent: 8,
                                                        service_fee_value: 2678.40,
                                                        total_investment: 36158.40,
                                                        installments: [
                                                            { term_months: 24, interest_rate_percent: 1.49, monthly_installment: 1612.45 },
                                                            { term_months: 60, interest_rate_percent: 1.68, monthly_installment: 842.30 },
                                                            { term_months: 96, interest_rate_percent: 1.80, monthly_installment: 698.15 }
                                                        ]
                                                    }
                                                }
                                            ],
                                            meta: {
                                                page: 1,
                                                limit: 20,
                                                total: 1,
                                                totalPages: 1
                                            }
                                        }
                                    }
                                }
                            },
                            "401": { 
                                description: "Não autorizado - Chave de API inválida ou expirada",
                                content: {
                                    "application/json": {
                                        schema: { $ref: "#/components/schemas/Error" },
                                        example: { error: { code: "UNAUTHORIZED", message: "Chave de API inválida ou expirada" } }
                                    }
                                }
                            },
                            "403": { 
                                description: "Forbidden - Chave não possui scope necessário",
                                content: {
                                    "application/json": {
                                        schema: { $ref: "#/components/schemas/Error" },
                                        example: { error: { code: "FORBIDDEN", message: "Esta chave de API não possui permissão para ler pedidos" } }
                                    }
                                }
                            }
                        }
                    },
                    post: {
                        summary: "Criar Pedido",
                        description: `Cria um novo pedido de instalação de sistema fotovoltaico. O tipo de cliente (PF/PJ) é identificado automaticamente pelo documento informado:

- **CPF (11 dígitos)** → Pessoa Física. Prazos disponíveis: 24, 30, 36, 48, 60, 72, 84, 96 meses.
- **CNPJ (14 dígitos)** → Pessoa Jurídica. Prazos disponíveis: 24, 36, 48, 60 meses.

A resposta inclui a simulação financeira calculada automaticamente com base no tipo de cliente. Requer scope \`orders:write\`.`,
                        tags: ["Pedidos"],
                        requestBody: {
                            required: true,
                            content: {
                                "application/json": {
                                    schema: { $ref: "#/components/schemas/CreateOrderRequest" },
                                    examples: {
                                        "Pessoa Física (PF)": {
                                            summary: "Criar pedido para Pessoa Física",
                                            description: "Exemplo completo com CPF. Campos exclusivos de PF: marital_status, birth_date, gender, occupation.",
                                            value: {
                                                document: "123.456.789-09",
                                                name: "João Silva",
                                                email: "joao@email.com",
                                                phone: "(11) 99999-9999",
                                                postal_code: "01234-567",
                                                street: "Rua das Flores",
                                                number: "123",
                                                complement: "Apto 45",
                                                neighborhood: "Centro",
                                                city: "São Paulo",
                                                state: "SP",
                                                current_consumption: 500,
                                                monthly_bill_value: 450.00,
                                                system_power: 7.5,
                                                equipment_value: 25000.00,
                                                labor_value: 5000.00,
                                                other_costs: 1000.00,
                                                payment_day: 15,
                                                financing_term: 60,
                                                marital_status: "married",
                                                birth_date: "1985-05-15",
                                                gender: "M",
                                                occupation: "Engenheiro",
                                                notes: "Cliente com restrição de horário para instalação"
                                            }
                                        },
                                        "Pessoa Jurídica (PJ)": {
                                            summary: "Criar pedido para Pessoa Jurídica",
                                            description: "Exemplo completo com CNPJ. Campos exclusivos de PJ: company_name, contact_name, trading_name, incorporation_date. Prazos disponíveis: 24, 36, 48, 60 meses.",
                                            value: {
                                                document: "12.345.678/0001-95",
                                                name: "Empresa Exemplo LTDA",
                                                company_name: "Empresa Exemplo LTDA",
                                                contact_name: "Carlos Souza",
                                                email: "contato@empresaexemplo.com.br",
                                                phone: "(11) 3333-4444",
                                                postal_code: "04567-890",
                                                street: "Avenida Paulista",
                                                number: "1000",
                                                complement: "Sala 501",
                                                neighborhood: "Bela Vista",
                                                city: "São Paulo",
                                                state: "SP",
                                                current_consumption: 2500,
                                                monthly_bill_value: 2200.00,
                                                system_power: 35.0,
                                                equipment_value: 95000.00,
                                                labor_value: 15000.00,
                                                other_costs: 5000.00,
                                                payment_day: 10,
                                                financing_term: 36,
                                                trading_name: "Empresa Exemplo",
                                                incorporation_date: "2010-03-20", 
                                                notes: "Instalação no telhado do galpão principal"
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        responses: {
                            "201": {
                                description: "Pedido criado com sucesso",
                                content: {
                                    "application/json": {
                                        schema: { $ref: "#/components/schemas/CreateOrderResponse" },
                                        examples: {
                                            "Resposta PF": {
                                                summary: "Resposta para Pessoa Física",
                                                value: {
                                                    success: true,
                                                    message: "Pedido criado com sucesso para Pessoa Física",
                                                    data: {
                                                        id: "550e8400-e29b-41d4-a716-446655440000",
                                                        kdi: "KDI-2024-00123",
                                                        status: "analysis_pending",
                                                        customer_type: "pf",
                                                        document: "12345678909",
                                                        equipment_value: 25000.00,
                                                        labor_value: 5000.00,
                                                        other_costs: 1000.00,
                                                        payment_day: 15,
                                                        financing_term: 60,
                                                        simulation: {
                                                            investment_value: 31000.00,
                                                            management_fee_percent: 8,
                                                            management_fee_value: 2480.00,
                                                            service_fee_percent: 8,
                                                            service_fee_value: 2678.40,
                                                            total_investment: 36158.40,
                                                            installments: [
                                                                { term_months: 24, interest_rate_percent: 1.49, monthly_installment: 1612.45 },
                                                                { term_months: 30, interest_rate_percent: 1.49, monthly_installment: 1312.30 },
                                                                { term_months: 36, interest_rate_percent: 1.60, monthly_installment: 1145.20 },
                                                                { term_months: 48, interest_rate_percent: 1.64, monthly_installment: 938.60 },
                                                                { term_months: 60, interest_rate_percent: 1.68, monthly_installment: 842.30 },
                                                                { term_months: 72, interest_rate_percent: 1.72, monthly_installment: 780.15 },
                                                                { term_months: 84, interest_rate_percent: 1.76, monthly_installment: 735.90 },
                                                                { term_months: 96, interest_rate_percent: 1.80, monthly_installment: 698.15 }
                                                            ]
                                                        },
                                                        created_at: "2024-01-15T10:30:00Z"
                                                    }
                                                }
                                            },
                                            "Resposta PJ": {
                                                summary: "Resposta para Pessoa Jurídica",
                                                value: {
                                                    success: true,
                                                    message: "Pedido criado com sucesso para Pessoa Jurídica",
                                                    data: {
                                                        id: "660e8400-e29b-41d4-a716-446655440001",
                                                        kdi: "KDI-2024-00124",
                                                        status: "analysis_pending",
                                                        customer_type: "pj",
                                                        document: "12345678000195",
                                                        equipment_value: 95000.00,
                                                        labor_value: 15000.00,
                                                        other_costs: 5000.00,
                                                        payment_day: 10,
                                                        financing_term: 36,
                                                        simulation: {
                                                            investment_value: 115000.00,
                                                            management_fee_percent: 4,
                                                            management_fee_value: 4600.00,
                                                            service_fee_percent: 8,
                                                            service_fee_value: 9568.00,
                                                            total_investment: 129168.00,
                                                            installments: [
                                                                { term_months: 24, interest_rate_percent: 2.5, monthly_installment: 7142.30 },
                                                                { term_months: 36, interest_rate_percent: 2.5, monthly_installment: 5480.15 },
                                                                { term_months: 48, interest_rate_percent: 2.5, monthly_installment: 4612.90 },
                                                                { term_months: 60, interest_rate_percent: 2.5, monthly_installment: 4098.45 }
                                                            ]
                                                        },
                                                        created_at: "2024-01-15T11:00:00Z"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            "400": {
                                description: "Requisição inválida - Dados faltando ou incorretos",
                                content: {
                                    "application/json": {
                                        schema: { $ref: "#/components/schemas/Error" },
                                        example: { error: { code: "MISSING_FIELDS", message: "Campos obrigatórios faltando: document, email" } }
                                    }
                                }
                            },
                            "401": { 
                                description: "Não autorizado - Chave de API inválida ou expirada",
                                content: {
                                    "application/json": {
                                        schema: { $ref: "#/components/schemas/Error" },
                                        example: { error: { code: "UNAUTHORIZED", message: "Chave de API inválida ou expirada" } }
                                    }
                                }
                            },
                            "403": { 
                                description: "Forbidden - Chave não possui scope necessário",
                                content: {
                                    "application/json": {
                                        schema: { $ref: "#/components/schemas/Error" },
                                        example: { error: { code: "FORBIDDEN", message: "Esta chave de API não possui permissão para criar pedidos" } }
                                    }
                                }
                            }
                        }
                    }
                },
                "/api/v1/orders/{id}": {
                    get: {
                        summary: "Detalhes do Pedido",
                        description: "Obtém detalhes de um pedido específico pelo ID (UUID) ou pelo documento do cliente (CPF/CNPJ). A chave de API só pode acessar pedidos que ela mesma criou. Inclui simulação financeira para PF (prazos de 24 a 96 meses) e PJ (prazos de 24 a 60 meses). Requer scope `orders:read`.",
                        tags: ["Pedidos"],
                        parameters: [
                            {
                                name: "id",
                                in: "path",
                                required: true,
                                schema: { type: "string" },
                                description: "ID do pedido (UUID) ou documento do cliente (CPF/CNPJ sem formatação)",
                                example: "550e8400-e29b-41d4-a716-446655440000"
                            }
                        ],
                        responses: {
                            "200": {
                                description: "Detalhes do pedido",
                                content: {
                                    "application/json": {
                                        schema: { $ref: "#/components/schemas/OrderDetailResponse" },
                                        example: {
                                            data: {
                                                id: "550e8400-e29b-41d4-a716-446655440000",
                                                kdi: "KDI-2024-00123",
                                                system_power: 7.5,
                                                current_consumption: 500,
                                                connection_voltage: "220",
                                                equipment_value: 25000.00,
                                                labor_value: 5000.00,
                                                other_costs: 1000.00,
                                                created_at: "2024-01-15T10:30:00Z",
                                                updated_at: "2024-01-15T10:35:00Z",
                                                status: "analysis_pending",
                                                payment_day: 15,
                                                financing_term: 60,
                                                monthly_bill_value: 450.00,
                                                notes: "",
                                                customers: {
                                                    type: "pf",
                                                    document: "12345678910",
                                                    name: "João Silva",
                                                    cpf: "12345678910",
                                                    individual_name: "João Silva",
                                                    marital_status: "married",
                                                    birth_date: "1985-05-15",
                                                    gender: "M",
                                                    occupation: "Engenheiro",
                                                    contact_name: "João Silva",
                                                    contact_email: "joao@email.com",
                                                    contact_phone: "11999999999",
                                                    address: {
                                                        postal_code: "01234567",
                                                        street: "Rua A",
                                                        number: "123",
                                                        complement: "",
                                                        neighborhood: "Centro",
                                                        city: "São Paulo",
                                                        state: "SP"
                                                    },
                                                    partner: null
                                                },
                                                sellers: { name: "Patricia Verena" },
                                                simulation: {
                                                    investment_value: 31000.00,
                                                    management_fee_percent: 8,
                                                    management_fee_value: 2480.00,
                                                    service_fee_percent: 8,
                                                    service_fee_value: 2678.40,
                                                    total_investment: 36158.40,
                                                    installments: [
                                                        { term_months: 24, interest_rate_percent: 1.49, monthly_installment: 1612.45 },
                                                        { term_months: 60, interest_rate_percent: 1.68, monthly_installment: 842.30 },
                                                        { term_months: 96, interest_rate_percent: 1.80, monthly_installment: 698.15 }
                                                    ]
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            "400": {
                                description: "Parâmetro inválido",
                                content: {
                                    "application/json": {
                                        schema: { $ref: "#/components/schemas/Error" },
                                        example: { error: { code: "INVALID_PARAMETER", message: "Parâmetro inválido. Use ID do pedido (UUID) ou documento (CPF/CNPJ)." } }
                                    }
                                }
                            },
                            "401": {
                                description: "Não autorizado",
                                content: {
                                    "application/json": {
                                        schema: { $ref: "#/components/schemas/Error" },
                                        example: { error: { code: "UNAUTHORIZED", message: "Chave de API inválida ou expirada" } }
                                    }
                                }
                            },
                            "403": {
                                description: "Acesso negado - Este pedido não foi criado por esta chave de API",
                                content: {
                                    "application/json": {
                                        schema: { $ref: "#/components/schemas/Error" },
                                        example: { error: { code: "FORBIDDEN", message: "Acesso negado. Este pedido não foi criado por esta chave de API." } }
                                    }
                                }
                            },
                            "404": {
                                description: "Pedido não encontrado",
                                content: {
                                    "application/json": {
                                        schema: { $ref: "#/components/schemas/Error" },
                                        example: { error: { code: "NOT_FOUND", message: "Pedido não encontrado ou acesso não autorizado." } }
                                    }
                                }
                            }
                        }
                    }
                },
                "/api/v1/data": {
                    get: {
                        summary: "Obter Dados da Chave API",
                        description: "Retorna informações da chave de API atual, incluindo configurações, permissões e webhook. Qualquer chave ativa pode acessar seus próprios dados.",
                        tags: ["Dados da API"],
                        responses: {
                            "200": {
                                description: "Dados da chave de API",
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object",
                                            properties: {
                                                data: { $ref: "#/components/schemas/ApiKeyData" },
                                                meta: {
                                                    type: "object",
                                                    properties: {
                                                        expires_in: { type: "string", example: "never" },
                                                        can_update: { type: "array", items: { type: "string" }, example: ["webhook_url"] }
                                                    }
                                                }
                                            }
                                        },
                                        example: {
                                            data: {
                                                id: "550e8400-e29b-41d4-a716-446655440000",
                                                name: "Integração Loja Online",
                                                key_prefix: "meo_sk_1234567890abcdef",
                                                scopes: ["orders:read", "orders:write"],
                                                status: "active",
                                                last_used_at: "2024-01-15T10:30:00Z",
                                                created_at: "2024-01-10T14:20:00Z",
                                                webhook_url: "https://seu-dominio.com/webhook",
                                                partner: {
                                                    id: "550e8400-e29b-41d4-a716-446655440001",
                                                    name: "Parceiro Exemplo"
                                                },
                                                internal_manager: {
                                                    id: "550e8400-e29b-41d4-a716-446655440002",
                                                    name: "Maria Silva",
                                                    email: "maria@empresa.com"
                                                }
                                            },
                                            meta: {
                                                expires_in: "never",
                                                can_update: ["webhook_url"]
                                            }
                                        }
                                    }
                                }
                            },
                            "401": { 
                                description: "Chave de API inválida ou expirada",
                                content: {
                                    "application/json": {
                                        schema: { $ref: "#/components/schemas/Error" },
                                        example: { error: { code: "UNAUTHORIZED", message: "Chave de API inválida ou expirada" } }
                                    }
                                }
                            }
                        }
                    },
                    post: {
                        summary: "Atualizar Webhook URL",
                        description: "Atualiza a URL de webhook associada à chave de API atual. Quando um webhook é configurado, a chave receberá notificações automáticas sobre alterações nos seus pedidos. Envie string vazia para remover o webhook.",
                        tags: ["Dados da API"],
                        requestBody: {
                            required: true,
                            content: {
                                "application/json": {
                                    schema: { $ref: "#/components/schemas/UpdateWebhookRequest" },
                                    example: { webhook_url: "https://seu-dominio.com/webhook" }
                                }
                            }
                        },
                        responses: {
                            "200": {
                                description: "Webhook atualizado com sucesso",
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object",
                                            properties: {
                                                success: { type: "boolean", example: true },
                                                message: { type: "string", example: "Webhook atualizado com sucesso" },
                                                data: {
                                                    type: "object",
                                                    properties: {
                                                        id: { type: "string", format: "uuid", example: "550e8400-e29b-41d4-a716-446655440000" },
                                                        webhook_url: { type: "string", format: "uri", example: "https://seu-dominio.com/webhook" },
                                                        updated_at: { type: "string", format: "date-time", example: "2024-01-15T10:30:00Z" }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            "400": {
                                description: "URL inválida ou campo não permitido",
                                content: {
                                    "application/json": {
                                        schema: { $ref: "#/components/schemas/Error" },
                                        example: { error: { code: "VALIDATION_ERROR", message: "URL de webhook inválida" } }
                                    }
                                }
                            },
                            "401": { 
                                description: "Chave de API inválida",
                                content: {
                                    "application/json": {
                                        schema: { $ref: "#/components/schemas/Error" },
                                        example: { error: { code: "UNAUTHORIZED", message: "Chave de API inválida ou expirada" } }
                                    }
                                }
                            },
                            "403": { 
                                description: "Chave de API desativada",
                                content: {
                                    "application/json": {
                                        schema: { $ref: "#/components/schemas/Error" },
                                        example: { error: { code: "FORBIDDEN", message: "Esta chave de API está desativada" } }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            tags: [
                { 
                    name: "Pedidos", 
                    description: "Endpoints para gerenciamento de pedidos de instalação fotovoltaica. Cada pedido é vinculado à chave de API que o criou. Inclui simulação financeira para PF (prazos de 24 a 96 meses) e PJ (prazos de 24 a 60 meses) com taxas específicas por tipo de cliente." 
                }, 
                { 
                    name: "Dados da API", 
                    description: "Endpoints para gerenciar dados da chave de API, incluindo configuração de webhooks para receber notificações automáticas sobre pedidos." 
                }
            ]
        }
    })
    return spec
}