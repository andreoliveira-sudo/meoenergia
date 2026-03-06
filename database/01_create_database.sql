-- ============================================================
-- MEO ENERGIA - Script 01: Criar Banco de Dados
-- ============================================================
-- IMPORTANTE: Execute este script conectado ao PostgreSQL
-- como superusuário ou com permissão de CREATE DATABASE.
--
-- Conexão: psql -h <HOST> -p 5432 -U <USER> -d postgres
-- ============================================================

-- Criar banco de dados de desenvolvimento
CREATE DATABASE meoenergia_dev
    WITH ENCODING 'UTF8'
    LC_COLLATE = 'pt_BR.UTF-8'
    LC_CTYPE = 'pt_BR.UTF-8'
    TEMPLATE = template0;

-- Caso o locale pt_BR não esteja disponível, use:
-- CREATE DATABASE meoenergia_dev WITH ENCODING 'UTF8' TEMPLATE = template0;

-- Habilitar extensões necessárias (conectar no meoenergia_dev primeiro)
-- \c meoenergia_dev
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";
