# Fluxo Funcional (Simulações/Pedidos) e Arquitetura de PDF

Este documento descreve o fluxo de trabalho do usuário nos módulos de Simulação e Pedidos, além de detalhar a arquitetura atual de geração de PDFs, identificando pontos de otimização.

## 1. Mapa de Navegação e Funcionalidades

O sistema segue um fluxo linear onde uma **Simulação** aprovada evolui para um **Pedido**.

```mermaid
flowchart LR
    subgraph "Módulo de Vendas"
        Dash[Dashboard] --> Sims[Lista de Simulações]
        Dash --> Orders[Lista de Pedidos]
        
        Sims -->|Ação| NewSim[Nova Simulação]
        Sims -->|Ação| ViewSim[Detalhes Simulação]
        
        NewSim -->|Input| Calc[Cálculo Solar]
        Calc -->|Output| SaveSim[Salvar Simulação]
        
        SaveSim -->|Gerar Proposta| GenPDF_Sim[PDF Simulação]
        SaveSim -->|Aprovar| CreateOrder[Gerar Pedido]
        
        CreateOrder -->|Transição de Status| Orders
        Orders -->|Gerar Contrato| GenPDF_Order[PDF Pedido]
    end
```

## 2. Arquitetura de Geração de PDF (Atual vs Refatoração)

Atualmente, a geração de PDF ocorre no servidor (Server Action) utilizando `pdf-lib` e templates/fontes "chumbados" no código em formato Base64.

### Fluxo Atual (Com Gargalo de Performance)

O uso de strings Base64 gigantes (Template + Fontes) diretamente no código aumenta o consumo de memória e o tamanho do bundle.

```mermaid
sequenceDiagram
    participant User as Frontend (Client)
    participant Action as Server Action
    participant DB as Supabase DB
    participant Assets as Constantes (Base64)

    User->>Action: Solicitar PDF (ID)
    Action->>DB: Buscar Dados (Simulação/Pedido)
    DB-->>Action: Dados JSON
    
    note right of Action: ⚠️ Carrega string Base64 gigante em memória
    Action->>Assets: Importar Template PDF (Base64)
    Action->>Assets: Importar Fontes (Base64)
    
    Action->>Action: Buffer.from(Base64)
    Action->>Action: pdfDoc.load(templateBytes)
    Action->>Action: Desenhar Textos no PDF
    Action->>Action: Salvar PDF (Output Base64)
    
    Action-->>User: Retorna string PDF Base64
    User->>User: Download Blob
```

### Problemas Identificados (Escopo Fase A)

1.  **Hardcoded Assets**: O template do PDF e as fontes estão dentro do código-fonte (`src/lib/constants`), inflando o tamanho da aplicação.
2.  **Uso de Memória**: Converter grandes strings Base64 para Buffer a cada requisição é custoso para o servidor.
3.  **Manutenção**: Alterar o template exige recompilar e redeployar a aplicação.

### Otimização Prevista (Storage)

A refatoração (Prioridade 3) visa mover esses assets para o **Supabase Storage**.

```mermaid
flowchart TD
    subgraph "Cloud Storage (Otimizado)"
        Bucket[Supabase Storage]
        Bucket -->|Download Stream| Template.pdf
        Bucket -->|Download Stream| Fontes.ttf
    end
    
    ServerAction -->|Fetch| Bucket
    ServerAction -->|Processamento Leve| PDF_Buffer
```
