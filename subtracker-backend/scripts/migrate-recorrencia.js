require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const pg = require('pg');

const sqlPath = path.join(__dirname, '..', 'database', 'schema-recorrencia.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

const statements = sql
  .split(';')
  .map((chunk) =>
    chunk
      .split('\n')
      .filter((line) => !line.trim().startsWith('--'))
      .join('\n')
      .trim(),
  )
  .filter(Boolean);

const pool = new pg.Pool({
  user: process.env.DB_USER ?? 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  database: process.env.DB_NAME ?? 'subtracker_db',
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT ?? 5432),
});

async function migrar() {
  for (const statement of statements) {
    await pool.query(statement);
  }

  const colunas = await pool.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'contas'
      AND column_name IN (
        'recorrente', 'periodicidade', 'proxima_cobranca', 'origem',
        'parcela_atual', 'parcela_total', 'ocorrencias', 'primeira_cobranca', 'total_gasto', 'situacao'
      )
    ORDER BY column_name
  `);

  const tabelas = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'assinaturas'
  `);

  const conexaoCols = await pool.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'conexao_open_finance'
      AND column_name IN ('transacoes_analisadas', 'recorrentes_encontradas', 'eventuais_descartadas', 'saldos')
    ORDER BY column_name
  `);

  console.log(`Colunas de recorrência: ${colunas.rows.map((row) => row.column_name).join(', ')}`);
  console.log(`Contagens da última leitura: ${conexaoCols.rows.map((row) => row.column_name).join(', ') || 'nenhuma'}`);
  console.log(tabelas.rows.length === 0 ? 'Tabela assinaturas removida.' : 'Tabela assinaturas ainda existe.');
  await pool.end();
}

migrar().catch(async (error) => {
  const codigo = error && error.code ? ` (${error.code})` : '';
  const mensagem = error && error.message ? error.message : String(error);
  console.error(`Falha na migração${codigo}: ${mensagem}`);
  await pool.end();
  process.exit(1);
});
