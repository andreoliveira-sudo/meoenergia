import { createSwaggerSpec } from "next-swagger-doc"

export const getApiDocs = async () => {
    const spec = createSwaggerSpec({
        apiFolder: "src/app/api", // define api folder
        definition: {
            openapi: "3.0.0",
            info: {
                title: "MEO ERP Integration API",
                version: "1.0",
                description: `
**API de Integração MEO Energia**

Esta API permite que parceiros e integradores acessem dados de Pedidos e Simulações de forma programática.

**Autenticação**
Todas as requisições devem incluir o header \`x-api-key\` com a chave gerada no painel do desenvolvedor.
Exemplo: \`x-api-key: meo_sk_...\`
`
            },
            components: {
                securitySchemes: {
                    ApiKeyAuth: {
                        type: "apiKey",
                        in: "header",
                        name: "x-api-key"
                    }
                },
                schemas: {
                    Order: {
                        type: "object",
                        properties: {
                            id: { type: "string", format: "uuid" },
                            kdi: { type: "string" },
                            status: { type: "string" },
                            system_power: { type: "number" },
                            financials: {
                                type: "object",
                                properties: {
                                    equipment: { type: "number" },
                                    labor: { type: "number" },
                                    other: { type: "number" },
                                    subtotal: { type: "number" }
                                }
                            },
                            customer: {
                                type: "object",
                                properties: {
                                    company_name: { type: "string" },
                                    cnpj: { type: "string" }
                                }
                            },
                            created_at: { type: "string", format: "date-time" }
                        }
                    },
                    Simulation: {
                        type: "object",
                        properties: {
                            id: { type: "string", format: "uuid" },
                            kdi: { type: "string" },
                            status: { type: "string" },
                            system_power: { type: "number" },
                            financials: {
                                type: "object",
                                properties: {
                                    equipment: { type: "number" },
                                    labor: { type: "number" }
                                }
                            },
                            customer: {
                                type: "object",
                                properties: {
                                    company_name: { type: "string" }
                                }
                            }
                        }
                    }
                }
            },
            security: [
                {
                    ApiKeyAuth: []
                }
            ],
            paths: {
                "/api/v1/orders": {
                    get: {
                        summary: "Listar Pedidos",
                        tags: ["Pedidos"],
                        parameters: [
                            {
                                name: "page",
                                in: "query",
                                schema: { type: "integer", default: 1 }
                            },
                            {
                                name: "limit",
                                in: "query",
                                schema: { type: "integer", default: 20 }
                            }
                        ],
                        responses: {
                            "200": {
                                description: "Lista de pedidos recuperada com sucesso",
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object",
                                            properties: {
                                                data: {
                                                    type: "array",
                                                    items: { $ref: "#/components/schemas/Order" }
                                                },
                                                meta: {
                                                    type: "object",
                                                    properties: {
                                                        total: { type: "integer" },
                                                        page: { type: "integer" }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            "401": { description: "Não autorizado" }
                        }
                    }
                },
                "/api/v1/orders/{id}": {
                    get: {
                        summary: "Detalhes do Pedido",
                        tags: ["Pedidos"],
                        parameters: [
                            {
                                name: "id",
                                in: "path",
                                required: true,
                                schema: { type: "string", format: "uuid" }
                            }
                        ],
                        responses: {
                            "200": {
                                description: "Detalhes do pedido",
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object",
                                            properties: {
                                                data: { $ref: "#/components/schemas/Order" }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                "/api/v1/simulations": {
                    get: {
                        summary: "Listar Simulações",
                        tags: ["Simulações"],
                        responses: {
                            "200": {
                                description: "Lista de simulações",
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object",
                                            properties: {
                                                data: {
                                                    type: "array",
                                                    items: { $ref: "#/components/schemas/Simulation" }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    })
    return spec
}
