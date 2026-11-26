import fs from 'node:fs';
import path from 'node:path';
import db from './database';

/**
 * Cria as tabelas se ainda não existirem (schema.sql é idempotente: CREATE TABLE IF NOT EXISTS).
 * Funciona rodando de src/ (ts-node) e de dist/ (build), pois ambos ficam dois níveis abaixo da raiz.
 */
export async function garantirSchema(): Promise<void> {
  const arquivo = path.resolve(__dirname, '../../database/schema.sql');
  const sql = fs.readFileSync(arquivo, 'utf8');
  await db.query(sql);
  console.log('[DB] Schema verificado.');
}
