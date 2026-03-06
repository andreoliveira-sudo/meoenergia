# 6. Segurança de Dados e Privacidade (Blindagem)

A segurança dos seus dados comerciais é nossa prioridade máxima. Este capítulo explica como o MEO ERP garante que **apenas as pessoas certas tenham acesso às informações certas**, utilizando uma tecnologia de "Blindagem de Banco de Dados".

## 6.1 O que é a "Blindagem"? (Multi-tenancy)

Imagine um prédio comercial com vários escritórios. Embora todos estejam no mesmo prédio (o sistema), a chave do escritório A não abre a porta do escritório B.

No MEO ERP, aplicamos esse conceito diretamente no "coração" do sistema (o Banco de Dados). Isso significa que, mesmo que ocorra um erro humano ou de programação, **o sistema é fisicamente incapaz de entregar os dados do Parceiro A para o Parceiro B**.

Isso é o que chamamos tecnicamente de *Row Level Security* (Segurança a Nível de Linha), ou seja, cada linha de informação tem um "dono" e só pode ser vista por ele.

## 6.2 Níveis de Acesso

Para garantir a operação fluida e segura, definimos três níveis claros de hierarquia:

### 👑 Administrador (MEO Energia)
*   **Acesso Total**: Visão completa de todo o sistema para suporte, auditoria e gestão global.
*   **Responsabilidade**: Gerenciar configurações críticas e aprovar novos parceiros.

### 🤝 Parceiro (Sua Empresa)
*   **Acesso Restrito**: Você vê **apenas** os seus clientes, seus vendedores e seus pedidos.
*   **Privacidade**: Seus dados comerciais (margens, clientes, estratégias) são invisíveis para outros parceiros concorrentes.

### 👷 Integrador / Vendedor
*   **Acesso Operacional**: Vê apenas os pedidos e simulações que ele mesmo criou ou que foram delegados a ele.
*   **Foco**: Ferramentas operacionais para fechar vendas, sem acesso a dados sensíveis de gestão da empresa parceira.

## 6.3 Benefícios para seu Negócio

3.  **Segurança em Camadas**: Diferente de sistemas comuns que protegem apenas a "porta da frente" (login), nós protegemos cada "documento" individualmente dentro do cofre.

## 6.4 Roteiro de Validação e Entrega

Utilize este roteiro para testar e validar as funcionalidades entregues neste item.

### ✅ Teste 1: O Teste do "Espião" (Isolamento de Dados)
1.  Abra dois navegadores diferentes (ex: Chrome e Edge).
2.  No Chrome, logue com o **Parceiro A** e crie um cliente "Cliente Exclusivo A".
3.  No Edge, logue com o **Parceiro B**.
4.  Tente procurar pelo "Cliente Exclusivo A" na lista de clientes do Parceiro B.
5.  **Resultado**: O cliente NÃO deve aparecer. O sistema deve se comportar como se o registro não existisse para o Parceiro B.

### ✅ Teste 2: Visão do Administrador
1.  Logue como **Administrador MEO**.
2.  Vá para a lista de clientes.
3.  **Resultado**: Você deve conseguir ver tanto o "Cliente Exclusivo A" quanto os clientes do Parceiro B, confirmando sua visão gerencial global.

### ✅ Teste 3: Restrição de Vendedor
1.  Logue como um **Vendedor** do Parceiro A.
2.  Tente acessar a tela de "Configurações Globais" ou "Gestão de Usuários".
3.  **Resultado**: O sistema deve bloquear o acesso e redirecionar para a Home, ou nem mostrar o botão no menu, provando que os níveis de acesso estão funcionando.
