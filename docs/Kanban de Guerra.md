# **📌 QUADRO DE TAREFAS (TASK BOARD) – FASE A.2**

Projeto: MEO Energia  
Sprint: War Room (15/01 \- 19/01)

## **🏗️ PILAR 1: FUNDAÇÃO E DADOS (Prioridade Máxima)**

### **🎫 TICKET: BACK-01**

Título: Bifurcação de Entidade no Banco de Dados  
Responsável: 🧠 Matheus  
Estimativa: 2h  
📝 História do Usuário:  
"Como sistema, preciso saber se um cliente é PJ ou PF para aplicar regras de validação e exibição diferentes."  
**🛠️ Implementação Técnica:**

1. **Database (Supabase):** Criar e rodar migration SQL.  
   ALTER TABLE customers ADD COLUMN type text CHECK (type IN ('pj', 'pf')) DEFAULT 'pj';  
   CREATE INDEX idx\_customers\_type ON customers(type);

2. **TypeScript Definitions:**  
   * Abrir src/lib/definitions/customers.d.ts.  
   * Adicionar type CustomerType \= 'pj' | 'pf';.  
   * Atualizar a interface Customer para incluir type: CustomerType.

**✅ Critério de Aceite:**

* \[ \] Coluna criada no Supabase.  
* \[ \] O projeto compila sem erros de tipagem (npm run build passa).

### **🎫 TICKET: BACK-02**

Título: Blindagem de Segurança (Row Level Security)  
Responsável: 🧠 Matheus  
Estimativa: 3h  
📝 História do Usuário:  
"Como administrador, preciso garantir que dados de PJ e PF nunca se misturem e que usuários PF só vejam seus próprios dados."  
**🛠️ Implementação Técnica:**

1. **Supabase Policies:**  
   * Navegar para supabase/migrations/.  
   * Criar nova migration que dá DROP nas policies atuais de customers e orders.  
   * Criar novas policies:  
     * Enable read access for own data (PF): auth.uid() \= user\_id.  
     * Enable read access for sellers (PJ): Lógica existente de parceiros.  
2. **Validação:**  
   * Tentar dar SELECT \* FROM customers logado como um usuário PF (deve retornar apenas 1 linha).

**✅ Critério de Aceite:**

* \[ \] Usuário PF não consegue listar clientes de outros vendedores.  
* \[ \] Usuário Vendedor PJ consegue ver sua carteira.

### **🎫 TICKET: BACK-03**

Título: Abertura de Rota Pública (Middleware)  
Responsável: 🧠 Matheus  
Estimativa: 1h  
📝 História do Usuário:  
"Como visitante não logado, quero acessar /simulacao para calcular minha economia."  
**🛠️ Implementação Técnica:**

1. **Middleware Logic:**  
   * Abrir src/lib/supabase/middleware.ts (chamado pelo middleware.ts).  
   * Identificar a função updateSession.  
   * Antes da verificação de \!user, adicionar exceção:  
     if (request.nextUrl.pathname.startsWith('/simulacao')) {  
       return response;  
     }

2. **Teste:** Tentar acessar localhost:3000/simulacao em aba anônima.

**✅ Critério de Aceite:**

* \[ \] Rota /simulacao não redireciona para /sign-in.  
* \[ \] Rotas /dashboard/\* continuam protegidas.

## **🚀 PILAR 2: MOTOR DE SIMULAÇÃO & LÓGICA**

### **🎫 TICKET: CORE-01**

Título: Factory de Validação Dinâmica (Zod)  
Responsável: 🧠 Matheus  
Estimativa: 2h  
📝 História do Usuário:  
"Como usuário PF, não quero ser obrigado a preencher CNPJ ou Inscrição Estadual."  
**🛠️ Implementação Técnica:**

1. **Refatoração do Schema:**  
   * Abrir src/lib/validations/customer.ts.  
   * Transformar o customerSchema (objeto estático) em uma função:

export const getCustomerSchema \= (type: 'pj' | 'pf') \=\> {  
   // Retorna schema com campos opcionais baseados no type  
}

2. **Máscaras:**  
   * Verificar src/lib/masks.ts. Garantir que existe máscara para CPF.

**✅ Critério de Aceite:**

* \[ \] Schema PF valida CPF e ignora IE.  
* \[ \] Schema PJ valida CNPJ e exige IE.

### **🎫 TICKET: CORE-02**

Título: Engine de Cálculo "Stateless"  
Responsável: 🧠 Matheus  
Estimativa: 2h  
📝 História do Usuário:  
"Como frontend, preciso invocar o cálculo de economia sem criar um pedido no banco de dados."  
**🛠️ Implementação Técnica:**

1. **Extração de Lógica:**  
   * Abrir src/actions/simulations/create-simulation.ts.  
   * Identificar a matemática de cálculo (tarifa, voltagem, economia).  
   * Recortar essa lógica e colar em um novo arquivo src/lib/calculation-engine.ts (função pura).  
2. **Server Action Pública:**  
   * Criar src/actions/public/calculate-savings.ts.  
   * Importar a engine e retornar JSON.

**✅ Critério de Aceite:**

* \[ \] Nova função recebe { consumo, cidade } e retorna { economia: 100.00 }.  
* \[ \] Nenhuma linha é inserida na tabela simulations.

## **🎨 PILAR 3: INTERFACE DE USUÁRIO (FRONTEND)**

### **🎫 TICKET: FRONT-01**

Título: Landing Page de Simulação  
Responsável: 🎨 Emerson  
Estimativa: 4h  
📝 História do Usuário:  
"Como lead, quero uma tela bonita e simples para colocar meu consumo de energia."  
**🛠️ Implementação Técnica:**

1. **Estrutura de Pastas:**  
   * Criar src/app/(public)/simulacao/page.tsx.  
   * Criar src/app/(public)/layout.tsx (Layout limpo, sem Sidebar do Dashboard, apenas Logotipo no topo).  
2. **Formulário:**  
   * Usar componentes de src/components/ui/ (Card, Input, Button).  
   * Campos: Nome, Whatsapp, Cidade, Consumo Médio (kWh).  
   * Ao submeter, chamar a Server Action do Matheus (CORE-02).

**✅ Critério de Aceite:**

* \[ \] Tela carrega sem login.  
* \[ \] Formulário envia dados.

### **🎫 TICKET: FRONT-02**

Título: Tela de Resultado & Conversão  
Responsável: 🎨 Emerson  
Estimativa: 3h  
📝 História do Usuário:  
"Como lead, quero ver o valor da economia e clicar num botão para me cadastrar."  
**🛠️ Implementação Técnica:**

1. **Exibição:**  
   * Pode ser na mesma página (Renderização Condicional) ou /simulacao/resultado.  
   * Mostrar números grandes em verde (ex: "R$ 5.000,00/ano").  
2. **CTA (Call to Action):**  
   * Botão "Quero Garantir Essa Economia".  
   * Redireciona para /sign-up?type=pf (passando parâmetros na URL para pré-preencher o cadastro).

**✅ Critério de Aceite:**

* \[ \] Resultado bate com o cálculo.  
* \[ \] Botão leva para a tela de criação de conta/pedido.

### **🎫 TICKET: FRONT-03**

Título: Adaptação do Menu Lateral (Sidebar)  
Responsável: 🎨 Emerson  
Estimativa: 2h  
📝 História do Usuário:  
"Como usuário PF, não quero ver botões de 'Sócios' ou 'Equipamentos' que não fazem sentido para mim."  
**🛠️ Implementação Técnica:**

1. **Configuração de Menu:**  
   * Abrir src/components/app-sidebar/nav-items.ts.  
   * Adicionar propriedade roles: \['pj', 'pf'\] em cada item.  
2. **Renderização:**  
   * Abrir src/components/app-sidebar/index.tsx.  
   * Recuperar o tipo do usuário (via Context ou Prop).  
   * Filtrar o array navItems antes do .map().

**✅ Critério de Aceite:**

* \[ \] Logar como PJ \-\> Vê tudo.  
* \[ \] Logar como PF \-\> Vê menu reduzido.

### **🎫 TICKET: FRONT-04**

Título: Formulário de Cadastro Inteligente  
Responsável: 🎨 Emerson  
Estimativa: 4h  
📝 História do Usuário:  
"Como usuário, quero selecionar se sou PJ ou PF e ver os campos mudarem."  
**🛠️ Implementação Técnica:**

1. **Componente:** src/components/forms/edit-customer-form.tsx.  
2. **Lógica:**  
   * Adicionar \<RadioGroup\> no topo ("Pessoa Física" / "Pessoa Jurídica").  
   * Usar form.watch('type').  
   * Se for 'pf': Ocultar inputs de cnpj, ie, partners.  
   * Se for 'pj': Mostrar tudo.  
3. **Integração:** Usar a validação dinâmica criada em CORE-01 (resolver: zodResolver(getSchema(type))).

**✅ Critério de Aceite:**

* \[ \] Alternar o botão limpa/esconde os campos.  
* \[ \] Submit funciona para os dois tipos.

## **⏱️ PILAR 4: RASTREABILIDADE (TIMELINE)**

### **🎫 TICKET: BACK-04**

Título: Gravação de Eventos (Audit Log)  
Responsável: 🧠 Matheus  
Estimativa: 2h  
📝 História do Usuário:  
"Como sistema, devo registrar toda vez que o status de um pedido muda."  
**🛠️ Implementação Técnica:**

1. **Migration:** Criar tabela order\_history (id, order\_id, status\_from, status\_to, created\_at).  
2. **Server Action:**  
   * Abrir src/actions/orders/update-order-status.ts.  
   * Logo após o update na tabela orders, adicionar um insert na order\_history.

**✅ Critério de Aceite:**

* \[ \] Ao mudar status no painel, aparece uma nova linha no banco de dados na tabela de histórico.

### **🎫 TICKET: FRONT-05**

Título: Visualização da Timeline  
Responsável: 🎨 Emerson  
Estimativa: 3h  
📝 História do Usuário:  
"Como admin, quero ver a linha do tempo do pedido dentro do detalhe (Sheet)."  
**🛠️ Implementação Técnica:**

1. **Arquivo:** src/components/dialogs/view-order-sheet.tsx.  
2. **Data Fetching:** Buscar dados de order\_history relacionados ao ID do pedido.  
3. **UI:**  
   * Adicionar uma aba "Histórico".  
   * Renderizar lista vertical com data e status.

**✅ Critério de Aceite:**

* \[ \] Histórico aparece em ordem cronológica inversa (mais recente no topo).

