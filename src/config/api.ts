// API publicada (Render). Usada quando o site roda hospedado e VITE_API_URL não foi definida.
const API_PUBLICADA = 'https://api-subtracker.onrender.com/api';
const API_LOCAL = 'http://localhost:3000/api';

const rodandoLocal =
  typeof window === 'undefined' || /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);

// VITE_API_URL sempre tem prioridade; sem ela, local usa localhost e hospedado usa a API publicada.
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || (rodandoLocal ? API_LOCAL : API_PUBLICADA);
