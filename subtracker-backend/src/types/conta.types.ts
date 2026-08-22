export interface Conta {
  id: number;
  nome: string;
  preco: number;
  data: string;
  pago: boolean;
  categoria: string;
}

export interface CriarContaInput {
  nome: string;
  preco: number;
  data: string;
  pago?: boolean;
  categoria?: string;
}

export interface AtualizarContaInput {
  nome: string;
  preco: number;
  data: string;
  categoria?: string;
}

export interface AtualizarStatusInput {
  pago: boolean;
}
