export interface Conta {
  id: number;
  nome: string;
  preco: number;
  data: string;
  pago: boolean;
  categoria: string;
}

export interface CriarContaPayload {
  nome: string;
  preco: number;
  data: string;
  pago?: boolean;
  categoria?: string;
}

export interface AtualizarContaPayload {
  nome: string;
  preco: number;
  data: string;
  categoria?: string;
}

export interface ImportarPluggyResponse {
  mensagem: string;
  totalEncontradas: number;
  totalImportadas: number;
  totalIgnoradas: number;
  contas: Conta[];
}

export interface ConnectTokenResponse {
  accessToken: string;
}
