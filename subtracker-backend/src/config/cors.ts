import type { CorsOptions } from 'cors';

// Sem CORS_ORIGIN no ambiente: front local e o site publicado na Vercel.
const origensPadrao = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://sub-tracker-xi.vercel.app',
];

export function getCorsOptions(): CorsOptions {
  const origensEnv = process.env.CORS_ORIGIN?.split(',').map((origem) => origem.trim()).filter(Boolean);

  return {
    origin: origensEnv && origensEnv.length > 0 ? origensEnv : origensPadrao,
  };
}
