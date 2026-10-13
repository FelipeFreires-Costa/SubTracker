import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/validation';

function isDbError(error: unknown): error is { code?: string } {
  return typeof error === 'object' && error !== null && 'code' in error;
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof AppError) {
    res.status(error.status).json({ erro: error.message });
    return;
  }

  if (isDbError(error)) {
    if (error.code === 'ECONNREFUSED') {
      res.status(503).json({
        erro: 'Banco de dados indisponível. Verifique se o PostgreSQL está rodando.',
      });
      return;
    }

    if (error.code === '42P01') {
      res.status(503).json({
        erro: 'Tabela não encontrada. Na pasta subtracker-backend rode: node scripts/migrate-recorrencia.js',
      });
      return;
    }

    if (error.code === '42703') {
      res.status(503).json({
        erro: 'O banco precisa da atualização de recorrência. Na pasta subtracker-backend rode: node scripts/migrate-recorrencia.js',
      });
      return;
    }
  }

  console.error('[API] Erro interno:', error);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
}
