require('dotenv').config({ quiet: true });
const pg = require('pg');

const pool = new pg.Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT || 5432),
});

async function limpar() {
  await pool.query('DELETE FROM contas');
  await pool.query('DELETE FROM conexao_open_finance');
  const contas = await pool.query('SELECT COUNT(*)::int AS total FROM contas');
  const conexoes = await pool.query('SELECT COUNT(*)::int AS total FROM conexao_open_finance');
  console.log(`Contas: ${contas.rows[0].total}. Conexões: ${conexoes.rows[0].total}.`);
  await pool.end();
}

limpar().catch(async (error) => {
  console.error(error.message);
  await pool.end();
  process.exit(1);
});
