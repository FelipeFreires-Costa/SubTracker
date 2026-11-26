import { API_BASE_URL } from '../config/api';

interface ApiErrorBody {
  erro?: string;
  detalhes?: string;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function mensagemSemConexao(): string {
  const local = /localhost|127\.0\.0\.1/.test(API_BASE_URL);
  const noSiteHospedado =
    typeof window !== 'undefined' && !/localhost|127\.0\.0\.1/.test(window.location.hostname);

  if (local && noSiteHospedado) {
    return 'Este site está publicado, mas a API ainda aponta para o seu computador (localhost). Configure VITE_API_URL com o endereço do servidor publicado.';
  }
  if (local) {
    return 'Não consegui falar com o servidor. Confira se o backend está rodando (npm run dev na pasta subtracker-backend) e se o CORS libera este endereço.';
  }
  return 'Não consegui falar com o servidor. Confira se ele está no ar e se o CORS libera este site.';
}

const CHAVE_ACESSO = 'subtracker:codigo-acesso';

function lerCodigo(): string {
  try {
    return localStorage.getItem(CHAVE_ACESSO) ?? '';
  } catch {
    return '';
  }
}

function salvarCodigo(codigo: string): void {
  try {
    if (codigo) localStorage.setItem(CHAVE_ACESSO, codigo);
    else localStorage.removeItem(CHAVE_ACESSO);
  } catch {
    // armazenamento indisponível: o código só vale até recarregar
  }
}

function comCodigo(options?: RequestInit): RequestInit {
  const codigo = lerCodigo();
  if (!codigo) return options ?? {};
  return {
    ...options,
    headers: { ...(options?.headers ?? {}), 'x-access-token': codigo },
  };
}

async function chamar(url: string, options?: RequestInit, jaPediuCodigo = false): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(url, comCodigo(options));
  } catch {
    throw new ApiError(mensagemSemConexao(), 0);
  }

  // Servidor protegido por código de acesso: pede uma vez e tenta de novo.
  if (response.status === 401 && !jaPediuCodigo && typeof window !== 'undefined') {
    const digitado = window.prompt(
      lerCodigo()
        ? 'Código de acesso incorreto. Digite novamente:'
        : 'Este servidor é protegido. Digite o código de acesso do SubTracker:',
    );
    if (digitado) {
      salvarCodigo(digitado.trim());
      return chamar(url, options, true);
    }
  }

  return response;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  let body: T | ApiErrorBody;
  try {
    body = (await response.json()) as T | ApiErrorBody;
  } catch {
    throw new ApiError(
      response.ok
        ? 'O servidor respondeu em um formato inesperado.'
        : `O servidor respondeu com erro ${response.status}. Confira se a API está configurada corretamente.`,
      response.status,
    );
  }

  if (!response.ok) {
    const errorBody = body as ApiErrorBody;
    throw new ApiError(errorBody.erro ?? 'Erro na requisição.', response.status);
  }

  return body as T;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await chamar(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  });

  return parseResponse<T>(response);
}

export async function apiDownload(path: string, nomeArquivo: string): Promise<void> {
  const response = await chamar(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    let mensagem = 'Não foi possível baixar o arquivo.';
    try {
      const body = (await response.json()) as ApiErrorBody;
      mensagem = body.erro ?? mensagem;
    } catch {
      // resposta não era JSON
    }
    throw new ApiError(mensagem, response.status);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
