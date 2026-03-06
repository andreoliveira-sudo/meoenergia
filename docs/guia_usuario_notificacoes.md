# 5. Automação e Notificações (Transparência)

Este capítulo explica como o sistema MEO Energia mantém você, seus clientes e parceiros informados automaticamente sobre o andamento de cada processo, garantindo total transparência sem a necessidade de envios manuais de mensagens.

## 5.1 Como Funciona?

O sistema monitora todas as atividades em tempo real (como a aprovação de uma simulação ou a mudança de status de um pedido) e dispara notificações automáticas.

Utilizamos dois canais principais para garantir que a informação chegue a quem precisa:

1.  **WhatsApp Automático**: Enviamos mensagens diretas para o celular do seu **Cliente Final** ou **Parceiro** para atualizações urgentes e importantes (ex: "Seu financiamento foi aprovado!").
2.  **Central de Notificações (Sininho)**: Dentro da plataforma, você (Integrador/Parceiro) recebe alertas visuais no ícone de "Sino" no topo da tela, ideal para acompanhar o dia a dia da sua carteira de pedidos.

## 5.2 Gatilhos: Quando as mensagens são enviadas?

Não enviamos mensagens o tempo todo para não gerar incômodo. As notificações são disparadas apenas em momentos chaves do processo:

### Para o Cliente Final
*   **Simulação Realizada**: Assim que uma proposta comercial é gerada.
*   **Pedido em Análise**: Quando a documentação é enviada para o banco/cooperativa.
*   **Crédito Aprovado**: A melhor notícia! O cliente é avisado imediatamente para assinar o contrato.
*   **Pendência de Documentos**: Caso falte algum documento, o cliente recebe um alerta para regularizar.

### Para o Parceiro/Integrador
*   **Boas-vindas**: Confirmação da aprovação do seu cadastro de parceria.
*   **Atualização de Pedidos**: Sempre que um pedido sob sua responsabilidade muda de fase (do envio para o banco até o pagamento), você recebe um alerta na plataforma e no WhatsApp.

## 5.3 Benefícios
*   **Profissionalismo**: Mensagens padronizadas e automáticas transmitem organização e confiança.

## 5.4 Roteiro de Validação e Entrega

Utilize este roteiro para testar e validar as funcionalidades entregues neste item.

### ✅ Teste 1: Notificação de Aprovação (Parceiro)
1.  Como Administrador, vá em **Gestão de Parceiros**.
2.  Aprove um parceiro que esteja com status "Pendente" (use um número de celular de teste seu no cadastro).
3.  **Resultado**: O número cadastrado no parceiro deve receber uma mensagem de WhatsApp instantânea: *"Parabéns, sua parceria com a MEO Energia foi aprovada!"*.

### ✅ Teste 2: Notificação de Pedido (Cliente)
1.  Crie um pedido de teste associado a um cliente (use seu próprio número no cadastro do cliente).
2.  Mude o status do pedido para **Aprovado**.
3.  **Resultado**: O "cliente" (seu número) deve receber: *"Olá [Nome], boas notícias! Seu pedido #123 foi aprovado."*.

### ✅ Teste 3: Auditoria no Código
1.  Para garantir que isso não é um processo manual escondido, verifique o arquivo `src/lib/events/order-events.ts`.
2.  **Resultado**: Você verá códigos como `await sendWhatsAppMessage(...)` atrelados aos status, provando a automação.
