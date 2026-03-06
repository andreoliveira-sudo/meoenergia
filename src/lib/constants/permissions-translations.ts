import type { PermissionId } from "./permissions"

export const PERMISSION_TRANSLATIONS: Record<PermissionId, string> = {
    "admin:dashboard:view": "Visualizar Painel Principal",
    "admin:data:manage": "Gerenciar Dados Globais (Equipamentos, Marcas, etc.)",
    "admin:data:view": "Visualizar Dados Globais",
    "admin:settings:manage": "Gerenciar Configurações e Chaves de API",
    "admin:settings:view": "Visualizar Configurações Gerais",
    "admin:users:manage": "Gerenciar Permissões de Usuários",
    "admin:users:view": "Visualizar Usuários",
    "admin:permissions:manage": "Gerenciar Permissões de Funções",
    "partners:manage": "Gerenciar Parceiros (Aprovar, Rejeitar, Editar)",
    "partners:view": "Visualizar Lista de Parceiros",
    "reports:view": "Visualizar Relatórios",
    "sellers:manage": "Gerenciar Vendedores",
    "sellers:view": "Visualizar Lista de Vendedores",
    "simulations:create": "Criar Novas Simulações",
    "simulations:view": "Ver Simulações Criadas",
    "simulations:rates:manage": "Gerenciar Taxas de Simulação",
    "orders:view": "Ver Pedidos",
    "orders:status": "Alterar Status de Pedidos",
    "orders:rates:manage": "Gerenciar Taxas de Pedidos",
    "customers:view": "Visualizar Clientes"
}

export const RESOURCE_TRANSLATIONS: Record<string, string> = {
    admin: "Administração",
    partners: "Parceiros",
    sellers: "Vendedores",
    reports: "Relatórios",
    simulations: "Simulações",
    orders: "Pedidos",
    customers: "Clientes"
}
