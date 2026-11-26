import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

/**
 * Código de acesso opcional. Se ACCESS_TOKEN estiver definido no ambiente, toda rota
 * da API (exceto /health e o preflight do CORS) exige o cabeçalho x-access-token.
 * Sem ACCESS_TOKEN (uso local), nada muda.
 */
function iguais(a: string, b: string): boolean {
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function exigirAcesso(req: Request, res: Response, next: NextFunction): void {
  const esperado = process.env.ACCESS_TOKEN;
  if (!esperado) return next();
  if (req.method === 'OPTIONS' || req.path === '/health') return next();

  const recebido = req.header('x-access-token') ?? '';
  if (recebido && iguais(recebido, esperado)) return next();

  res.status(401).json({ erro: 'Código de acesso ausente ou incorreto.', codigo: 'ACESSO_NEGADO' });
}
