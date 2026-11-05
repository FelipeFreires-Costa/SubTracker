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

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const body = (await response.json()) as T | ApiErrorBody;

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
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  });

  return parseResponse<T>(response);
}

export async function apiDownload(path: string, nomeArquivo: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${path}`);

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
