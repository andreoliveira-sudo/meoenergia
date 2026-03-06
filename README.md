# Ideas

- [X] Sidebar footer Suport and feedback
- [X] Sidebar Logout
- [X] Configurar o admin para setar as permissões users
- [ ] Configurar o admin para setar as permissões para roles
- [ ] Deixar Kits no form de simulations searchable
- [ ] Erro personalizado em simulations form para avisar o erro, ex: cnpj já existente

## APONTAMENTOS:

- [X] *VENDEDOR* - Na lista não tem opção de Editar
- [X] *PARCEIRO* : Não puxa CNPJ - CEP puxa
- [X] *SIMULACOES* : Aqui puxa CNPJ e CEP
- [ ] *Falta* : no final falta: botão de gravar simulação e imprimir
- [X] *Dados do Projeto* - *Campo “Outros”* – Está como obrigatório mudar para opcional
- [X] *Dados do Cliente* - *Campo “Faturamento Obrigatório”* – Está como obrigatório mudar para opcional

## RESPOSTA
Agora é possível editar o Vendedor na tabela, Parceiros agora busca dados pelo cnpj, Campos

Vendedores:
- Agora é possível editar vendedores dentro da tabela

Parceiros:
- Agora busca dados pelo cnpj

Cliente:
<!-- - É criado um cliente novo com os dados do Passo 2 do formulário de nova simulação -->

Simulações:
- Campo "Outros", dentro do kit de Equipamentos(Passo 1) se tornou opcional
- Campo "Faturamento", dentro de Dados do Client(Passo 2) se tornou opcional
<!-- - Usamos os Dados do Client(Passo 2) para criar um cliente novo automaticamente, porém agora é obrigatório inserir uma senha dentro do formulário -->

# Permissions
- admin:dashboard:view
- admin:data:manage
- admin:settings:manage

## Admin

### Data
- admin:data:create
- admin:data:delete
- admin:data:edit
- admin:data:view

### Settings
- admin:settings:edit
- admin:settings:view

### Users
- admin:users:manage
- admin:users:view

### Permissions
- admin:permissions:manage

## Partners
- partners:manage
- partners:view

## Sellers
- sellers:manage
- sellers:view

## Simulations
- simulations:create

## Reports
- reports:view

---


## Permissions (permissions_seed.csv)
id,description
admin:dashboard:view,"Permite visualizar o painel principal da área de administração."
admin:data:manage,"Permite gerenciar dados globais do sistema, como equipamentos, marcas e tipos de estrutura."
admin:data:view,"Can view the data management page for equipments, brands, and structure types."
admin:settings:manage,"Can edit general settings like interest rates."
admin:settings:view,"Can view the general settings page."
admin:users:manage,"Can manage users and their permissions."
admin:users:view,"Can view the user management page."
admin:permissions:manage,"Permite visualizar e editar as permissões de cada função de usuário no sistema."
partners:manage,"Can manage partners (approve, reject, edit)."
partners:view,"Can view the partners list."
reports:view,"Can view reports."
sellers:manage,"Can manage sellers."
sellers:view,"Can view the sellers list."
simulations:create,"Can create new simulations."


--- 

## Problems
- [] /dashboard e /dashboard/home estão duplicados
