-- SubTracker - schema inicial
-- Execute: psql -U postgres -d subtracker_db -f database/schema.sql

CREATE TABLE IF NOT EXISTS contas (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  preco NUMERIC(10, 2) NOT NULL CHECK (preco >= 0),
  data DATE NOT NULL,
  pago BOOLEAN NOT NULL DEFAULT FALSE,
  categoria VARCHAR(100) NOT NULL DEFAULT 'Outros',
  recorrente BOOLEAN NOT NULL DEFAULT TRUE,
  periodicidade VARCHAR(40),
  proxima_cobranca DATE,
  origem VARCHAR(20) NOT NULL DEFAULT 'manual',
  parcela_atual INTEGER,
  parcela_total INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Identificador técnico da conexão Open Finance. Sem extrato, saldo ou descrição.
-- A coluna saldos existe em instalações antigas e é gravada vazia.
-- As colunas de contagem registram o último ciclo de análise, não o extrato.
CREATE TABLE IF NOT EXISTS conexao_open_finance (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  item_id VARCHAR(128) NOT NULL,
  sincronizado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  transacoes_analisadas INTEGER,
  recorrentes_encontradas INTEGER,
  eventuais_descartadas INTEGER,
  saldos TEXT
);
