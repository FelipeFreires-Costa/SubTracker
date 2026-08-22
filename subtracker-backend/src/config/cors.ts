import type { CorsOptions } from 'cors';

const origensPadrao = ['http://localhost:5173', 'http://127.0.0.1:5173'];

export function getCorsOptions(): CorsOptions {
  const origensEnv = process.env.CORS_ORIGIN?.split(',').map((origem) => origem.trim()).filter(Boolean);

  return {
    origin: origensEnv && origensEnv.length > 0 ? origensEnv : origensPadrao,
  };
}
