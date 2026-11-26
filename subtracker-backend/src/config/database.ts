import pg from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString && !process.env.DB_PASSWORD) {
  throw new Error(
    'Defina DATABASE_URL (nuvem) ou DB_PASSWORD (local) no .env do backend (veja .env.example).',
  );
}

// Bancos hospedados (Neon, Render, Supabase...) exigem SSL. Local não usa.
// DB_SSL=false desliga; DB_SSL=true força.
function usarSsl(): boolean {
  if (process.env.DB_SSL === 'false') return false;
  if (process.env.DB_SSL === 'true') return true;
  return Boolean(connectionString) && !/localhost|127\.0\.0\.1/.test(connectionString ?? '');
}

const pool = new pg.Pool(
  connectionString
    ? {
        connectionString,
        ssl: usarSsl() ? { rejectUnauthorized: false } : undefined,
      }
    : {
        user: process.env.DB_USER ?? 'postgres',
        host: process.env.DB_HOST ?? 'localhost',
        database: process.env.DB_NAME ?? 'subtracker_db',
        password: process.env.DB_PASSWORD,
        port: Number(process.env.DB_PORT ?? 5432),
        ssl: usarSsl() ? { rejectUnauthorized: false } : undefined,
      },
);

pool.on('error', (err: Error) => {
  console.error('[DB] Erro inesperado no pool de conexões:', err);
});

export type DbExecutor = {
  query: (text: string, params?: unknown[]) => Promise<pg.QueryResult>;
};

const db: DbExecutor & {
  withTransaction: <T>(fn: (client: pg.PoolClient) => Promise<T>) => Promise<T>;
} = {
  query: (text: string, params?: unknown[]) => pool.query(text, params),

  async withTransaction<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const resultado = await fn(client);
      await client.query('COMMIT');
      return resultado;
    } catch (erro) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackErro) {
        console.error('[DB] Falha ao reverter transação:', rollbackErro);
      }
      throw erro;
    } finally {
      client.release();
    }
  },
};

export default db;
