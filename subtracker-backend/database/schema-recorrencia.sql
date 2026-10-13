-- Campos do algoritmo de recorrência e minimização LGPD.
-- Execute no banco subtracker_db se a tabela contas já existir.

ALTER TABLE contas
  ADD COLUMN IF NOT EXISTS recorrente BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS periodicidade VARCHAR(40),
  ADD COLUMN IF NOT EXISTS proxima_cobranca DATE,
  ADD COLUMN IF NOT EXISTS origem VARCHAR(20) NOT NULL DEFAULT 'manual';

UPDATE contas
SET proxima_cobranca = data
WHERE proxima_cobranca IS NULL;

-- Extrato bruto não é mais armazenado.
DROP TABLE IF EXISTS assinaturas;

-- Identificador técnico da conexão Open Finance. Sem extrato, saldo ou descrição.
CREATE TABLE IF NOT EXISTS conexao_open_finance (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  item_id VARCHAR(128) NOT NULL,
  sincronizado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE conexao_open_finance
  ADD COLUMN IF NOT EXISTS transacoes_analisadas INTEGER,
  ADD COLUMN IF NOT EXISTS recorrentes_encontradas INTEGER,
  ADD COLUMN IF NOT EXISTS eventuais_descartadas INTEGER,
  ADD COLUMN IF NOT EXISTS saldos TEXT;

ALTER TABLE contas
  ADD COLUMN IF NOT EXISTS parcela_atual INTEGER,
  ADD COLUMN IF NOT EXISTS parcela_total INTEGER;
