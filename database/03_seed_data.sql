-- ============================================================
-- MEO ENERGIA - Script 03: Dados Iniciais (Seeds)
-- ============================================================
-- Execute conectado ao banco meoenergia_dev:
-- psql -h 177.53.148.179 -p 5432 -U codex -d meoenergia_dev -f 03_seed_data.sql
-- ============================================================

-- ============================================================
-- PERMISSÕES DO SISTEMA (20 permissões)
-- ============================================================

INSERT INTO permissions (id, description) VALUES
    ('admin:dashboard:view', 'Visualizar Painel Principal'),
    ('admin:data:manage', 'Gerenciar Dados Globais (Equipamentos, Marcas, etc.)'),
    ('admin:data:view', 'Visualizar Dados Globais'),
    ('admin:settings:manage', 'Gerenciar Configurações e Chaves de API'),
    ('admin:settings:view', 'Visualizar Configurações Gerais'),
    ('admin:users:manage', 'Gerenciar Permissões de Usuários'),
    ('admin:users:view', 'Visualizar Usuários'),
    ('admin:permissions:manage', 'Gerenciar Permissões de Funções'),
    ('customers:view', 'Visualizar Clientes'),
    ('partners:manage', 'Gerenciar Parceiros (Aprovar, Rejeitar, Editar)'),
    ('partners:view', 'Visualizar Lista de Parceiros'),
    ('reports:view', 'Visualizar Relatórios'),
    ('sellers:manage', 'Gerenciar Vendedores'),
    ('sellers:view', 'Visualizar Lista de Vendedores'),
    ('simulations:create', 'Criar Novas Simulações'),
    ('simulations:view', 'Ver Simulações Criadas'),
    ('simulations:rates:manage', 'Gerenciar Taxas de Simulação'),
    ('orders:view', 'Ver Pedidos'),
    ('orders:status', 'Alterar Status de Pedidos'),
    ('orders:rates:manage', 'Gerenciar Taxas de Pedidos')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PERMISSÕES POR ROLE
-- ============================================================

-- Admin: todas as permissões (tratado via código, mas registrar para referência)
INSERT INTO role_permissions (role, permission_id) VALUES
    ('admin', 'admin:dashboard:view'),
    ('admin', 'admin:data:manage'),
    ('admin', 'admin:data:view'),
    ('admin', 'admin:settings:manage'),
    ('admin', 'admin:settings:view'),
    ('admin', 'admin:users:manage'),
    ('admin', 'admin:users:view'),
    ('admin', 'admin:permissions:manage'),
    ('admin', 'customers:view'),
    ('admin', 'partners:manage'),
    ('admin', 'partners:view'),
    ('admin', 'reports:view'),
    ('admin', 'sellers:manage'),
    ('admin', 'sellers:view'),
    ('admin', 'simulations:create'),
    ('admin', 'simulations:view'),
    ('admin', 'simulations:rates:manage'),
    ('admin', 'orders:view'),
    ('admin', 'orders:status'),
    ('admin', 'orders:rates:manage')
ON CONFLICT DO NOTHING;

-- Staff: permissões operacionais
INSERT INTO role_permissions (role, permission_id) VALUES
    ('staff', 'admin:dashboard:view'),
    ('staff', 'admin:data:view'),
    ('staff', 'admin:settings:view'),
    ('staff', 'admin:users:view'),
    ('staff', 'customers:view'),
    ('staff', 'partners:view'),
    ('staff', 'reports:view'),
    ('staff', 'sellers:view'),
    ('staff', 'simulations:create'),
    ('staff', 'simulations:view'),
    ('staff', 'orders:view'),
    ('staff', 'orders:status')
ON CONFLICT DO NOTHING;

-- Partner: permissões limitadas
INSERT INTO role_permissions (role, permission_id) VALUES
    ('partner', 'customers:view'),
    ('partner', 'simulations:create'),
    ('partner', 'simulations:view'),
    ('partner', 'orders:view'),
    ('partner', 'reports:view')
ON CONFLICT DO NOTHING;

-- Seller: permissões de vendedor
INSERT INTO role_permissions (role, permission_id) VALUES
    ('seller', 'customers:view'),
    ('seller', 'simulations:create'),
    ('seller', 'simulations:view'),
    ('seller', 'orders:view'),
    ('seller', 'partners:view'),
    ('seller', 'reports:view')
ON CONFLICT DO NOTHING;

-- ============================================================
-- TIPOS DE EQUIPAMENTO (IDs fixos conforme o código)
-- ============================================================

INSERT INTO equipment_types (id, name) VALUES
    ('e070febb-6e62-480f-a398-bb02139e4d80', 'Módulo'),
    ('1a0c272e-0cd6-460a-a765-339cdee27c72', 'Inversor'),
    ('e5667c3c-7933-483a-9c2f-c015af369e33', 'Outros')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- TEMPLATES DE NOTIFICAÇÃO
-- ============================================================

INSERT INTO notification_templates (name, trigger_key, description, content, whatsapp_text, active, category) VALUES
    -- Pedidos
    ('Pedido - Análise Pendente', 'ORDER_ANALYSIS_PENDING', 'Enviado quando um novo pedido é criado', 'Seu pedido foi recebido e está aguardando análise.', 'Olá {{name}}, seu pedido foi recebido e está em análise. Acompanhe pelo portal.', TRUE, 'orders'),
    ('Pedido - Pré-Análise', 'ORDER_PRE_ANALYSIS', 'Enviado quando pedido entra em pré-análise', 'Seu pedido está em fase de pré-análise.', 'Olá {{name}}, seu pedido está em pré-análise. Em breve teremos novidades.', TRUE, 'orders'),
    ('Pedido - Confirmação Pendente', 'ORDER_CONFIRMATION_PENDING', 'Enviado quando pedido aguarda confirmação', 'Seu pedido aguarda confirmação de dados.', 'Olá {{name}}, precisamos da sua confirmação para dar andamento ao pedido.', TRUE, 'orders'),
    ('Pedido - Análise de Crédito', 'ORDER_CREDIT_ANALYSIS', 'Enviado quando pedido entra em análise de crédito', 'Seu pedido está em análise de crédito.', 'Olá {{name}}, seu pedido está em análise de crédito.', TRUE, 'orders'),
    ('Pedido - Análise Final', 'ORDER_FINAL_ANALYSIS', 'Enviado quando pedido entra em análise final', 'Seu pedido está em análise final.', 'Olá {{name}}, seu pedido está na fase final de análise.', TRUE, 'orders'),
    ('Pedido - Análise de Documentos', 'ORDER_DOCS_ANALYSIS', 'Enviado quando documentos estão sendo analisados', 'Os documentos do seu pedido estão sendo analisados.', 'Olá {{name}}, estamos analisando os documentos do seu pedido.', TRUE, 'orders'),
    ('Pedido - Aprovado', 'ORDER_APPROVED', 'Enviado quando pedido é aprovado', 'Parabéns! Seu pedido foi aprovado.', 'Olá {{name}}, ótima notícia! Seu pedido foi aprovado!', TRUE, 'orders'),
    ('Pedido - Pré-Aprovado', 'ORDER_PRE_APPROVED', 'Enviado quando pedido é pré-aprovado', 'Seu pedido foi pré-aprovado.', 'Olá {{name}}, seu pedido foi pré-aprovado! Estamos finalizando os detalhes.', TRUE, 'orders'),
    ('Pedido - Pré-Aprovado (Ressalva)', 'ORDER_PRE_APPROVED_ORANGE', 'Enviado quando pedido é pré-aprovado com ressalvas', 'Seu pedido foi pré-aprovado com algumas observações.', 'Olá {{name}}, seu pedido foi pré-aprovado com algumas observações. Verifique no portal.', TRUE, 'orders'),
    ('Pedido - Documentos Pendentes', 'DOCUMENTS_PENDING', 'Enviado quando há documentos pendentes', 'Há documentos pendentes no seu pedido.', 'Olá {{name}}, precisamos de alguns documentos para dar continuidade ao seu pedido.', TRUE, 'orders'),
    ('Pedido - Assinatura de Contrato', 'CONTRACT_SIGNING', 'Enviado quando contrato está pronto para assinatura', 'Seu contrato está pronto para assinatura.', 'Olá {{name}}, seu contrato está pronto para assinatura!', TRUE, 'orders'),
    ('Pedido - Congelado', 'ORDER_FROZEN', 'Enviado quando pedido é congelado', 'Seu pedido foi temporariamente congelado.', 'Olá {{name}}, seu pedido foi temporariamente pausado. Entraremos em contato.', TRUE, 'orders'),
    ('Pedido - Rejeitado', 'ORDER_REJECTED', 'Enviado quando pedido é rejeitado', 'Infelizmente seu pedido não foi aprovado.', 'Olá {{name}}, infelizmente seu pedido não foi aprovado neste momento.', TRUE, 'orders'),
    ('Pedido - Cancelado', 'ORDER_CANCELED', 'Enviado quando pedido é cancelado', 'Seu pedido foi cancelado.', 'Olá {{name}}, seu pedido foi cancelado.', TRUE, 'orders'),
    ('Pedido - Concluído', 'ORDER_COMPLETED', 'Enviado quando pedido é concluído', 'Seu pedido foi concluído com sucesso!', 'Olá {{name}}, seu pedido foi concluído com sucesso! Obrigado por escolher a MEO Energia.', TRUE, 'orders'),

    -- Parceiros
    ('Parceiro - Aprovado', 'PARTNER_APPROVED', 'Enviado quando parceiro é aprovado', 'Parabéns! Sua parceria foi aprovada.', 'Olá {{name}}, sua parceria com a MEO Energia foi aprovada! Acesse o portal para começar.', TRUE, 'partners'),

    -- Simulações
    ('Simulação - Contato Inicial', 'SIMULATION_INITIAL_CONTACT', 'Enviado quando simulação é criada', 'Sua simulação de energia solar foi recebida.', 'Olá {{name}}, recebemos sua simulação de energia solar. Em breve entraremos em contato.', TRUE, 'simulations'),
    ('Simulação - Em Revisão', 'SIMULATION_UNDER_REVIEW', 'Enviado quando simulação está em revisão', 'Sua simulação está sendo revisada por nossa equipe.', 'Olá {{name}}, sua simulação está sendo revisada. Aguarde nosso retorno.', TRUE, 'simulations'),
    ('Simulação - Em Negociação', 'SIMULATION_IN_NEGOTIATION', 'Enviado quando simulação entra em negociação', 'Sua simulação avançou para a fase de negociação.', 'Olá {{name}}, sua simulação avançou para negociação! Vamos definir os próximos passos.', TRUE, 'simulations'),
    ('Simulação - Convertida', 'SIMULATION_WON', 'Enviado quando simulação é convertida em pedido', 'Sua simulação foi convertida em pedido!', 'Olá {{name}}, sua simulação foi convertida em pedido! Acompanhe pelo portal.', TRUE, 'simulations'),
    ('Simulação - Perdida', 'SIMULATION_LOST', 'Enviado quando simulação é marcada como perdida', 'Sua simulação foi encerrada.', 'Olá {{name}}, sua simulação foi encerrada. Caso tenha interesse, entre em contato conosco.', TRUE, 'simulations')
ON CONFLICT DO NOTHING;

-- ============================================================
-- USUÁRIO ADMIN INICIAL (para primeiro acesso)
-- ============================================================
-- NOTA: A senha deve ser gerenciada via Supabase Auth ou
-- sistema de autenticação. Este registro é apenas na tabela users.

INSERT INTO users (id, email, name, role) VALUES
    ('00000000-0000-0000-0000-000000000001', 'admin@meoenergia.com.br', 'Administrador MEO', 'admin')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- FIM DOS SEEDS
-- ============================================================
