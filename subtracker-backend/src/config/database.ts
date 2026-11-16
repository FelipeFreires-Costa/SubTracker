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
