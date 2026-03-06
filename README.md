# MEO Leasing - Sistema de Gestao

Sistema web de gestao para operacoes de leasing de energia solar. Permite gerenciar parceiros, vendedores, clientes, simulacoes e pedidos com controle de permissoes granular.

## Tech Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Linguagem | TypeScript 5 |
| Runtime | React 19, Node.js |
| Backend (BaaS) | Supabase (Auth, PostgreSQL, Storage, RPC) |
| UI Components | shadcn/ui + Radix UI |
| Estilizacao | Tailwind CSS 4 |
| Formularios | React Hook Form + Zod |
| Tabelas | TanStack Table v8 |
| Data Fetching | TanStack React Query v5 |
| PDF | pdf-lib + fontkit |
| Linter | Biome |
| Deploy | Standalone (output: standalone) |

## Estrutura do Projeto

```
src/
  actions/          # Server Actions (auth, orders, customers, partners, sellers, simulations, etc.)
  app/
    (public)/       # Rotas publicas (simulador livre)
    api/v1/         # API REST (orders, simulations)
    dashboard/      # Area autenticada
      admin/        # Painel administrativo (data, settings, users, groups)
      customers/    # Gestao de clientes
      orders/       # Pedidos (PF/PJ)
      partners/     # Parceiros
      sellers/      # Vendedores
      simulations/  # Simulacoes
      notifications/
      developer/    # API keys e docs
  components/
    app-sidebar/    # Sidebar com drag-and-drop (swapy)
    data-tables/    # Tabelas de dados por entidade
    dialogs/        # Modais de edicao/visualizacao
    forms/          # Formularios por entidade
    ui/             # Componentes base (shadcn/ui)
  lib/
    constants/      # Constantes do sistema (permissoes, estados, etc.)
    definitions/    # Types (supabase.d.ts, orders, customers, etc.)
    supabase/       # Clientes Supabase (server, client, admin, middleware)
    validations/    # Schemas Zod
  hooks/            # Custom hooks
  providers/        # React Query provider
database/
  01_create_database.sql
  02_create_schema.sql   # 29 tabelas, 5 ENUMs, 3 funcoes RPC
  03_seed_data.sql
```

## Pre-requisitos

- Node.js 20+
- npm
- Conta Supabase (projeto configurado)

## Configuracao do Ambiente

### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/ricardomasterdev/meoenergia.git
cd meoenergia
npm install
```

### 2. Configurar variaveis de ambiente

Copie o arquivo de exemplo e preencha com as credenciais do seu projeto Supabase:

```bash
cp .env.example .env.local
```

Variaveis necessarias:

```env
# Supabase
SUPABASE_URL=https://SEU_PROJETO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Twilio (notificacoes SMS - opcional)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

### 3. Configurar o banco de dados

No Supabase SQL Editor, execute os scripts na ordem:

1. `database/02_create_schema.sql` - Cria tabelas, ENUMs e funcoes RPC
2. `database/03_seed_data.sql` - Popula dados iniciais (permissoes, equipamentos, etc.)

Apos executar:
```sql
NOTIFY pgrst, 'reload schema';
```

### 4. Rodar em desenvolvimento

```bash
npm run dev
```

O sistema estara disponivel em `http://localhost:3000/meo`

> **Nota:** O `basePath: "/meo"` esta configurado no `next.config.ts`. Todas as rotas sao prefixadas com `/meo`.

### 5. Build de producao

```bash
npm run build
npm start
```

## Scripts Disponiveis

| Comando | Descricao |
|---------|-----------|
| `npm run dev` | Inicia dev server com Turbopack |
| `npm run build` | Build de producao |
| `npm start` | Inicia servidor de producao |
| `npm run lint:biome` | Verifica lint com Biome |
| `npm run fix:biome` | Corrige lint automaticamente |
| `npm run gen-types` | Regenera types do Supabase |

## Banco de Dados

### Tabelas Principais

| Tabela | Descricao |
|--------|-----------|
| `users` | Usuarios do sistema (id = Supabase Auth UUID) |
| `permissions` | Permissoes do sistema (21 permissoes) |
| `role_permissions` | Permissoes padrao por role |
| `user_permissions` | Override de permissoes por usuario |
| `partners` | Parceiros comerciais |
| `sellers` | Vendedores internos |
| `customers` | Clientes (PF e PJ) |
| `simulations` | Simulacoes de leasing |
| `orders` | Pedidos gerados de simulacoes |
| `equipments` | Catalogo de equipamentos |
| `brands` | Marcas de equipamentos |
| `structure_types` | Tipos de estrutura |
| `interest_rates` | Taxas de juros configuradas |
| `notification_templates` | Templates de notificacao |
| `notification_logs` | Historico de notificacoes enviadas |
| `groups` / `group_members` / `group_rules` | Grupos e regras de negocios |
| `api_keys` / `api_usage_logs` | Chaves de API e logs de uso |

### ENUMs

- `user_role`: partner, seller, admin, staff
- `enum_partner_status`: pending, approved, rejected
- `enum_seller_status`: pending, approved, rejected
- `enum_simulation_status`: pending, ordered, approved, rejected, cancelled
- `enum_order_status`: pending, analysis, approved, rejected, cancelled, documentation

### Funcoes RPC

- `get_user_permissions_detailed(p_user_id)` - Retorna permissoes efetivas do usuario
- `calculate_savings(...)` - Calculo de economia para simulador publico
- `uuid_generate_v4()` - Wrapper para geracao de UUIDs

## Sistema de Permissoes

Roles: `admin`, `seller`, `partner`, `staff`

- **Admin**: Todas as permissoes automaticamente
- **Outros roles**: Permissoes definidas em `role_permissions` + overrides em `user_permissions`

### Permissoes Disponiveis

| Grupo | Permissoes |
|-------|-----------|
| Admin | `admin:dashboard:view`, `admin:data:manage`, `admin:data:view`, `admin:settings:manage`, `admin:settings:view`, `admin:users:manage`, `admin:users:view`, `admin:permissions:manage` |
| Clientes | `customers:view` |
| Parceiros | `partners:manage`, `partners:view`, `partners:view_all` |
| Vendedores | `sellers:manage`, `sellers:view` |
| Simulacoes | `simulations:create`, `simulations:view`, `simulations:rates:manage` |
| Pedidos | `orders:view`, `orders:status`, `orders:rates:manage` |
| Relatorios | `reports:view` |

## Ambientes

| Ambiente | URL | Supabase |
|----------|-----|----------|
| DEV | https://dev1.cdxsistemas.com.br/meo | uadpzkkjowfarlvlonkx |
| PROD | https://www.appmeo.com.br | ztadakijxdleljqjslfh |

> **Importante para PROD:** Remover `basePath: "/meo"` do `next.config.ts` pois a PROD roda na raiz do dominio.

## Deploy

O sistema usa `output: "standalone"` no Next.js. Para deploy:

1. Alterar apenas arquivos em `src/` (nao mexer em `.env.local` ou configuracoes do Supabase)
2. Rodar `npm run build`
3. O output standalone fica em `.next/standalone/`

### Fluxo de atualizacao

```bash
# 1. Fazer alteracoes no codigo
# 2. Commitar
git add -A
git commit -m "descricao da mudanca"
git push origin main

# 3. No servidor, fazer pull e rebuild
git pull origin main
npm run build
# Reiniciar o processo Node.js
```

## API REST

Endpoints disponiveis em `/api/v1/`:

- `GET/POST /api/v1/simulations` - Listar/criar simulacoes
- `GET /api/v1/simulations/:id` - Detalhe de simulacao
- `GET/POST /api/v1/orders` - Listar/criar pedidos
- `GET /api/v1/orders/:id` - Detalhe de pedido

Documentacao Swagger disponivel em `/dashboard/developer/docs`

Autenticacao via header `x-api-key` (chaves gerenciadas em `/dashboard/developer`).
