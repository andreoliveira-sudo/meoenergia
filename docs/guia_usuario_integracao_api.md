# 8. Integrações e Conectividade (API)

Este capítulo é destinado a empresas que já possuem seus próprios sistemas de gestão (CRM, ERP) e desejam que eles "conversem" automaticamente com o MEO ERP.

## 8.1 O MEO ERP não é uma ilha

Entendemos que sua empresa pode já usar ferramentas como Salesforce, RD Station, Pipedrive ou SAP. Por isso, construímos o MEO ERP com portas abertas para integração.

Nossa **API (Interface de Programação de Aplicações)** funciona como uma ponte universal, permitindo que dados fluam entre seus sistemas sem intervenção humana.

## 8.2 O que é possível fazer?

Aqui estão alguns exemplos reais do que a integração permite:

*   **Sincronização de Clientes**: Quando você cadastra um cliente no seu CRM, ele aparece automaticamente no MEO ERP pronto para receber uma proposta.
*   **Status de Pedidos**: Seu sistema financeiro pode receber um aviso automático assim que um pedido é aprovado no MEO ERP, disparando o faturamento.
*   **Dashboards Unificados**: Se você usa Power BI ou Tableau, pode puxar os dados de vendas de energia solar diretamente para seus relatórios gerenciais consolidados.

## 8.3 Como conectar? (Chave de API)

Para garantir que apenas os *seus* sistemas acessem os *seus* dados, utilizamos um método seguro chamado **Chave de API (API Key)**.

1.  **Solicitação**: O administrador da sua conta pode gerar uma "Senha Secreta" (Chave) específica para integrações.
2.  **Configuração**: Seu time de TI utiliza essa chave para configurar a conexão.
3.  **Segurança**: Essa chave não dá acesso visual à plataforma, servindo apenas para troca de dados entre máquinas. Se desconfiar de qualquer problema, você pode revogar a chave instantaneamente, cortando o acesso externo.

> **Nota**: A documentação técnica detalhada para seu time de desenvolvimento ou TI está disponível em um manual separado (`docs/integracao_api.md`).

## 8.4 Roteiro de Validação e Entrega

Utilize este roteiro para testar e validar as funcionalidades entregues neste item.

### ✅ Teste 1: Geração de Chave de API
1.  Acesse o menu **Admin > Integrações**.
2.  Clique em **Gerar Nova Chave**.
3.  **Resultado**: O sistema deve exibir uma nova hash (ex: `sk_live_...`) que deve ser copiada imediatamente.

### ✅ Teste 2: Conexão Externa (Simulação)
1. Para validar se a chave funciona, peça ao seu time de TI para rodar o seguinte teste simples (via Postman ou Terminal):
   ```bash
   curl -H "x-api-key: SUA_CHAVE_AQUI" https://app.meoenergia.com.br/api/v1/simulations
   ```
2.  **Resultado**: O sistema deve retornar uma lista de simulações em formato JSON, comprovando que a porta de entrada segura está ativa.

### ✅ Teste 3: Revogação de Acesso
1.  Na mesma tela de **Integrações**, clique em "Excluir" ou "Revogar" na chave criada.
2.  Tente rodar o comando do Teste 2 novamente.
3.  **Resultado**: O sistema deve recusar a conexão com erro `401 Unauthorized`, provando que você tem total controle sobre o acesso externo.
