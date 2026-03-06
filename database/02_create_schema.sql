-- ============================================================
-- MEO ENERGIA - Script 02: Schema Completo
-- ============================================================
-- Execute conectado ao banco meoenergia_dev:
-- psql -h 177.53.148.179 -p 5432 -U codex -d meoenergia_dev -f 02_create_schema.sql
-- ============================================================

-- Habilitar extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

DO $$ BEGIN CREATE TYPE customer_type AS ENUM ('pf', 'pj'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE enum_order_status AS ENUM ('analysis_pending','pre_analysis','confirmation_pending','credit_analysis','documents_pending','final_analysis','approved','rejected','contract_signing','completed','canceled','docs_analysis','pre_approved','frozen','pre_approved_orange'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE enum_partners_status AS ENUM ('pending', 'approved', 'rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE enum_simulation_status AS ENUM ('initial_contact','under_review','in_negotiation','won','lost'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE user_role AS ENUM ('partner', 'seller', 'admin', 'staff'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- TABELAS (ordem respeitando dependências de FK)
-- ============================================================

-- 1. users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    role user_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. user_profiles (1:1 com users)
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id UUID PRIMARY KEY,
    cpf TEXT NOT NULL,
    phone TEXT NOT NULL,
    cep TEXT NOT NULL,
    street TEXT NOT NULL,
    number TEXT NOT NULL,
    complement TEXT,
    neighborhood TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. permissions
CREATE TABLE IF NOT EXISTS permissions (
    id TEXT PRIMARY KEY,
    description TEXT NOT NULL
);

-- 4. role_permissions
CREATE TABLE IF NOT EXISTS role_permissions (
    role user_role NOT NULL,
    permission_id TEXT NOT NULL,
    PRIMARY KEY (role, permission_id),
    CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- 5. user_permissions
CREATE TABLE IF NOT EXISTS user_permissions (
    user_id UUID NOT NULL,
    permission_id TEXT NOT NULL,
    has_permission BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (user_id, permission_id),
    CONSTRAINT user_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT user_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- 6. user_categories
CREATE TABLE IF NOT EXISTS user_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    label TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. user_category_members
CREATE TABLE IF NOT EXISTS user_category_members (
    user_id UUID NOT NULL,
    category_id UUID NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, category_id),
    CONSTRAINT user_category_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT user_category_members_category_id_fkey FOREIGN KEY (category_id) REFERENCES user_categories(id) ON DELETE CASCADE
);

-- 8. sellers
CREATE TABLE IF NOT EXISTS sellers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    cpf TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    cep TEXT NOT NULL,
    street TEXT NOT NULL,
    number TEXT NOT NULL,
    complement TEXT,
    neighborhood TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    status enum_partners_status NOT NULL DEFAULT 'pending',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT sellers_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 9. partners
CREATE TABLE IF NOT EXISTS partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    seller_id UUID,
    legal_business_name TEXT NOT NULL,
    cnpj TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_mobile TEXT NOT NULL,
    cep TEXT NOT NULL,
    street TEXT NOT NULL,
    number TEXT NOT NULL,
    complement TEXT,
    neighborhood TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    kdi NUMERIC NOT NULL DEFAULT 0,
    status enum_partners_status NOT NULL DEFAULT 'pending',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT partners_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES sellers(id),
    CONSTRAINT partners_user_id_fkey1 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 10. partner_users (N:N)
CREATE TABLE IF NOT EXISTS partner_users (
    partner_id UUID NOT NULL,
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (partner_id, user_id),
    CONSTRAINT partner_users_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE,
    CONSTRAINT partner_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 11. customers
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by_user_id UUID NOT NULL,
    partner_id UUID,
    internal_manager UUID,
    type customer_type NOT NULL DEFAULT 'pj',
    name TEXT,
    company_name TEXT NOT NULL,
    cnpj TEXT NOT NULL,
    cpf TEXT,
    contact_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    street TEXT NOT NULL,
    number TEXT NOT NULL,
    complement TEXT,
    neighborhood TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    kdi NUMERIC NOT NULL DEFAULT 0,
    annual_revenue NUMERIC,
    incorporation_date TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT customers_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES users(id),
    CONSTRAINT customers_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES partners(id),
    CONSTRAINT customers_internal_manager_fkey FOREIGN KEY (internal_manager) REFERENCES sellers(id)
);

-- 12. equipment_brands
CREATE TABLE IF NOT EXISTS equipment_brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. equipment_types
CREATE TABLE IF NOT EXISTS equipment_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. equipments
CREATE TABLE IF NOT EXISTS equipments (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type_id UUID NOT NULL,
    brand_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT equipment_type_id_fkey FOREIGN KEY (type_id) REFERENCES equipment_types(id),
    CONSTRAINT equipment_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES equipment_brands(id)
);

-- 15. structure_types
CREATE TABLE IF NOT EXISTS structure_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. orders
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by_user_id UUID,
    customer_id UUID NOT NULL,
    seller_id UUID,
    kit_inverter_id INTEGER NOT NULL,
    kit_module_id INTEGER NOT NULL,
    kit_others INTEGER,
    structure_type UUID NOT NULL,
    status enum_order_status NOT NULL DEFAULT 'analysis_pending',
    energy_provider TEXT NOT NULL,
    connection_voltage TEXT NOT NULL,
    current_consumption NUMERIC NOT NULL,
    system_power NUMERIC NOT NULL,
    kdi NUMERIC NOT NULL DEFAULT 0,
    equipment_value NUMERIC NOT NULL,
    labor_value NUMERIC NOT NULL,
    other_costs NUMERIC DEFAULT 0,
    interest_rate NUMERIC,
    interest_rate_36 NUMERIC NOT NULL DEFAULT 0,
    interest_rate_48 NUMERIC NOT NULL DEFAULT 0,
    interest_rate_60 NUMERIC NOT NULL DEFAULT 0,
    service_fee NUMERIC,
    service_fee_36 NUMERIC NOT NULL DEFAULT 0,
    service_fee_48 NUMERIC NOT NULL DEFAULT 0,
    service_fee_60 NUMERIC NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT orders_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES users(id),
    CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT orders_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES sellers(id),
    CONSTRAINT orders_kit_inverter_fkey FOREIGN KEY (kit_inverter_id) REFERENCES equipments(id),
    CONSTRAINT orders_kit_module_fkey FOREIGN KEY (kit_module_id) REFERENCES equipments(id),
    CONSTRAINT orders_kit_others_fkey FOREIGN KEY (kit_others) REFERENCES equipments(id),
    CONSTRAINT orders_structure_type_fkey FOREIGN KEY (structure_type) REFERENCES structure_types(id)
);

-- 17. order_history
CREATE TABLE IF NOT EXISTS order_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL,
    changed_by UUID,
    old_status TEXT,
    new_status TEXT NOT NULL,
    reason TEXT,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT order_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT order_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES users(id)
);

-- 18. simulations
CREATE TABLE IF NOT EXISTS simulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by_user_id UUID,
    customer_id UUID,
    seller_id UUID,
    kit_inverter_id INTEGER,
    kit_module_id INTEGER,
    kit_others INTEGER,
    structure_type UUID,
    status enum_simulation_status NOT NULL DEFAULT 'initial_contact',
    energy_provider TEXT,
    connection_voltage TEXT,
    current_consumption NUMERIC NOT NULL,
    system_power NUMERIC,
    kdi NUMERIC NOT NULL DEFAULT 0,
    equipment_value NUMERIC,
    labor_value NUMERIC,
    other_costs NUMERIC,
    interest_rate NUMERIC,
    interest_rate_36 NUMERIC,
    interest_rate_48 NUMERIC,
    interest_rate_60 NUMERIC,
    service_fee NUMERIC,
    service_fee_36 NUMERIC,
    service_fee_48 NUMERIC,
    service_fee_60 NUMERIC,
    result JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT simulations_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES users(id),
    CONSTRAINT simulations_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT simulations_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES sellers(id),
    CONSTRAINT simulations_kit_inverter_fkey FOREIGN KEY (kit_inverter_id) REFERENCES equipments(id),
    CONSTRAINT simulations_kit_module_fkey FOREIGN KEY (kit_module_id) REFERENCES equipments(id),
    CONSTRAINT simulations_kit_others_fkey FOREIGN KEY (kit_others) REFERENCES equipments(id),
    CONSTRAINT simulations_structure_type_fkey FOREIGN KEY (structure_type) REFERENCES structure_types(id)
);

-- 19. groups
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_by_user_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT groups_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

-- 20. group_members
CREATE TABLE IF NOT EXISTS group_members (
    group_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role TEXT,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (group_id, user_id),
    CONSTRAINT group_members_group_id_fkey FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    CONSTRAINT group_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 21. group_rules
CREATE TABLE IF NOT EXISTS group_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID,
    entity TEXT NOT NULL,
    rule_type TEXT NOT NULL,
    target_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT group_rules_group_id_fkey FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    CONSTRAINT group_rules_target_id_fkey FOREIGN KEY (target_id) REFERENCES partners(id)
);

-- 22. notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    link TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 23. notification_templates
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    trigger_key TEXT,
    description TEXT,
    content TEXT NOT NULL,
    whatsapp_text TEXT,
    active BOOLEAN DEFAULT TRUE,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 24. notification_logs
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID,
    triggered_by_user_id UUID,
    channel TEXT NOT NULL,
    content TEXT,
    recipient_name TEXT,
    recipient_email TEXT,
    recipient_phone TEXT,
    status TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT notification_logs_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id),
    CONSTRAINT notification_logs_triggered_by_user_id_fkey FOREIGN KEY (triggered_by_user_id) REFERENCES users(id)
);

-- 25. api_keys
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    key_prefix TEXT NOT NULL,
    scopes TEXT[],
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 26. api_logs
CREATE TABLE IF NOT EXISTS api_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    api_key_id UUID,
    user_id UUID,
    method TEXT NOT NULL,
    path TEXT NOT NULL,
    status_code INTEGER NOT NULL,
    duration_ms INTEGER,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT api_logs_api_key_id_fkey FOREIGN KEY (api_key_id) REFERENCES api_keys(id),
    CONSTRAINT api_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 27. rates
CREATE TABLE IF NOT EXISTS rates (
    id TEXT PRIMARY KEY,
    value NUMERIC NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 28. rls_violation_audit
CREATE TABLE IF NOT EXISTS rls_violation_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    attempted_row_id TEXT,
    reason TEXT,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_customers_created_by ON customers(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_customers_partner ON customers(partner_id);
CREATE INDEX IF NOT EXISTS idx_customers_cnpj ON customers(cnpj);
CREATE INDEX IF NOT EXISTS idx_orders_created_by ON orders(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_simulations_created_by ON simulations(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_simulations_customer ON simulations(customer_id);
CREATE INDEX IF NOT EXISTS idx_simulations_status ON simulations(status);
CREATE INDEX IF NOT EXISTS idx_partners_user ON partners(user_id);
CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status);
CREATE INDEX IF NOT EXISTS idx_partners_cnpj ON partners(cnpj);
CREATE INDEX IF NOT EXISTS idx_sellers_user ON sellers(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notification_logs_order ON notification_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_logs_created ON api_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_order_history_order ON order_history(order_id);
CREATE INDEX IF NOT EXISTS idx_rls_audit_user ON rls_violation_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_rls_audit_table ON rls_violation_audit(table_name);

-- ============================================================
-- FUNÇÕES RPC
-- ============================================================

-- Função: has_permission
CREATE OR REPLACE FUNCTION has_permission(p_permission_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_role user_role;
    v_has BOOLEAN;
BEGIN
    v_user_id := current_setting('app.current_user_id', true)::UUID;

    IF v_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    SELECT role INTO v_role FROM users WHERE id = v_user_id;

    IF v_role = 'admin' THEN
        RETURN TRUE;
    END IF;

    SELECT has_permission INTO v_has
    FROM user_permissions
    WHERE user_id = v_user_id AND permission_id = p_permission_id;

    IF v_has IS NOT NULL THEN
        RETURN v_has;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM role_permissions
        WHERE role = v_role AND permission_id = p_permission_id
    );
END;
$$;

-- Função: get_user_permissions_detailed
CREATE OR REPLACE FUNCTION get_user_permissions_detailed(p_user_id UUID)
RETURNS TABLE (
    permission_id TEXT,
    description TEXT,
    effective BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_role user_role;
BEGIN
    SELECT role INTO v_role FROM users WHERE id = p_user_id;

    RETURN QUERY
    SELECT
        p.id AS permission_id,
        p.description,
        CASE
            WHEN v_role = 'admin' THEN TRUE
            WHEN up.has_permission IS NOT NULL THEN up.has_permission
            WHEN rp.permission_id IS NOT NULL THEN TRUE
            ELSE FALSE
        END AS effective
    FROM permissions p
    LEFT JOIN user_permissions up ON up.permission_id = p.id AND up.user_id = p_user_id
    LEFT JOIN role_permissions rp ON rp.permission_id = p.id AND rp.role = v_role
    ORDER BY p.id;
END;
$$;

-- Função: delete_user_with_auth
CREATE OR REPLACE FUNCTION delete_user_with_auth(target_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSON;
BEGIN
    DELETE FROM partner_users WHERE user_id = target_user_id;
    DELETE FROM group_members WHERE user_id = target_user_id;
    DELETE FROM user_permissions WHERE user_id = target_user_id;
    DELETE FROM user_category_members WHERE user_id = target_user_id;
    DELETE FROM notifications WHERE user_id = target_user_id;
    DELETE FROM api_keys WHERE user_id = target_user_id;
    DELETE FROM user_profiles WHERE user_id = target_user_id;
    DELETE FROM users WHERE id = target_user_id;

    v_result := json_build_object(
        'success', TRUE,
        'message', 'Usuário removido com sucesso',
        'user_id', target_user_id
    );

    RETURN v_result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', FALSE,
            'message', SQLERRM,
            'user_id', target_user_id
        );
END;
$$;

-- ============================================================
-- FIM DO SCHEMA
-- ============================================================
