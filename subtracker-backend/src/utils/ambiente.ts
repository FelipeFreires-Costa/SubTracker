/** Sandbox e rotas de avaliação só no uso local, salvo override explícito. */
export function apiLocalAtiva(): boolean {
  const host = process.env.HOST ?? '127.0.0.1';
  return host === '127.0.0.1' || host === 'localhost' || host === '::1';
}

export function sandboxApiAtiva(): boolean {
  if (process.env.SANDBOX_API === 'false') return false;
  if (process.env.SANDBOX_API === 'true') return true;
  return apiLocalAtiva();
}

export function avaliacaoApiAtiva(): boolean {
  if (process.env.AVALIACAO_API === 'false') return false;
  if (process.env.AVALIACAO_API === 'true') return true;
  return apiLocalAtiva();
}
