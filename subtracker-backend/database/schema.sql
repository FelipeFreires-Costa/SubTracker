-- SubTracker - schema inicial
-- Execute: psql -U postgres -d subtracker_db -f database/schema.sql

CREATE TABLE IF NOT EXISTS contas (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  preco NUMERIC(10, 2) NOT NULL CHECK (preco >= 0),
  data DATE NOT NULL,
  pago BOOLEAN NOT NULL DEFAULT FALSE,
  categoria VARCHAR(100) NOT NULL DEFAULT 'Outros',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assinaturas (
  id SERIAL PRIMARY KEY,
  item_id VARCHAR(255) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  preco NUMERIC(10, 2) NOT NULL CHECK (preco >= 0),
  data_transacao TIMESTAMP NOT NULL,
  categoria VARCHAR(100) NOT NULL DEFAULT 'Assinatura',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assinaturas_item_id ON assinaturas (item_id);
