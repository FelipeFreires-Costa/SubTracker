import pg from 'pg';

if (!process.env.DB_PASSWORD) {
  throw new Error('Defina DB_PASSWORD no arquivo .env do backend (veja .env.example).');
}

const pool = new pg.Pool({
  user: process.env.DB_USER ?? 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  database: process.env.DB_NAME ?? 'subtracker_db',
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT ?? 5432),
});

pool.on('error', (err: Error) => {
  console.error('[DB] Erro inesperado no pool de conexões:', err);
  process.exit(-1);
});

export default {
  query: (text: string, params?: unknown[]) => pool.query(text, params),
};
