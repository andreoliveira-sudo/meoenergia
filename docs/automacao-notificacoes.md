# Automação e Notificações (Transparência)

Este documento detalha o fluxo de automação e notificações do MEO ERP, garantindo transparência para Clientes, Integradores e MEO Energia.

## Visão Geral

O sistema utiliza uma abordagem híbrida para notificações:
1.  **WhatsApp (Evolution API)**: Para comunicação externa imediata com Clientes e Parceiros.
2.  **Notificações Internas (In-App)**: Para avisar Integradores sobre atualizações em seus pedidos dentro da plataforma.

## Diagrama de Fluxo

```mermaid
sequenceDiagram
    participant System as MEO System (Events)
    participant DB as Postgres DB
    participant Evo as Evolution API (WhatsApp)
    participant Client as Cliente
    participant Partner as Parceiro
    participant Integrator as Integrador

    Note over System: Gatilhos de Mudança de Status

    %% Fluxo de Pedidos
    alt Mudança de Status do Pedido (Ex: Análise -> Aprovado)
        System->>DB: Busca Template (trigger_key)
        System->>DB: Busca Dados do Pedido & Cliente
        
        par Notificação Interna (Integrador)
            System->>DB: INSERT into public.notifications (user_id=Integrator)
            DB-->>Integrator: Notificação no Sininho/Inbox 🔔
        and WhatsApp (Cliente)
            System->>Evo: POST /message/sendText (Phone, Msg)
            Evo-->>Client: Recebe mensagem WhatsApp 📱
        end
    end

    %% Fluxo de Simulações
    alt Mudança de Status da Simulação
        System->>DB: Busca Template
        System->>Evo: POST /message/sendText (Customer Phone)
        Evo-->>Client: Recebe mensagem WhatsApp 📱
    end

    %% Fluxo de Parceiros
    alt Parceiro Aprovado
        System->>DB: Busca Template (PARTNER_APPROVED)
        System->>Evo: POST /message/sendText (Partner Mobile)
        Evo-->>Partner: "Sua parceria foi aprovada!" 📱
    end
```

## Detalhes da Implementação

### 1. Gatilhos (Triggers)
Os eventos são disparados automaticamente pelo backend quando há alteração de status:

*   **Pedidos (`order-events.ts`)**:
    *   Mapeia status do banco (ex: `analysis_pending`, `approved`) para chaves de template (ex: `ORDER_ANALYSIS_PENDING`).
    *   Envia WhatsApp para o Cliente.
    *   Cria notificação interna para o Integrador responsável (`created_by_user_id`).
*   **Simulações (`simulation-events.ts`)**:
    *   Mapeia status (ex: `won`, `lost`) para templates.
    *   Envia WhatsApp para o Cliente.
*   **Parceiros (`partner-events.ts`)**:
    *   Gatilho único: `PARTNER_APPROVED`.
    *   Envia WhatsApp para o Parceiro.

### 2. Serviço de Mensagens
*   **Provider**: Evolution API (Self-hosted ou SaaS).
*   **Credenciais**: Gerenciadas via variáveis de ambiente (`EVOLUTION_API_URL`, `apikey`).
*   **Sanitização**: O sistema formata automaticamente números para o padrão 55 + DDD + 9 dígitos.

### 3. Templates Dinâmicos
Todas as mensagens são configuráveis via banco de dados (`notification_templates`), suportando variáveis dinâmicas:
*   `{{name}}`: Nome do Cliente/Parceiro.
*   `{{order_id}}`: ID curto do pedido.
*   `{{total_value}}`: Valor da simulação.
