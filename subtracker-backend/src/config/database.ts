import pg = require('pg');

const pool = new pg.Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'subtracker_db',
  password: 'root', // Insira a senha real
  port: 5432,
});

pool.on('error', (err: Error) => {
  console.error('Erro inesperado no pool do banco de dados', err);
  process.exit(-1);
});

export = {
  query: (text: string, params?: any[]) => pool.query(text, params),
};