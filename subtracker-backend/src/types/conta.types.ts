export type Periodicidade = 'mensal' | 'bimestral' | 'anual' | 'indefinida';
export type OrigemConta = 'manual' | 'pluggy';

export interface Conta {
  id: number;
  nome: string;
  preco: number;
  data: string;
  pago: boolean;
  categoria: string;
  recorrente: boolean;
  periodicidade: Periodicidade | null;
  proximaCobranca: string | null;
  origem: OrigemConta;
  parcelaAtual: number | null;
  parcelaTotal: number | null;
}

export interface CriarContaInput {
  nome: string;
  preco: number;
  data: string;
  pago?: boolean;
  categoria?: string;
  recorrente?: boolean;
  periodicidade?: Periodicidade | null;
  proximaCobranca?: string | null;
  origem?: OrigemConta;
  parcelaAtual?: number | null;
  parcelaTotal?: number | null;
}

export interface AtualizarContaInput {
  nome: string;
  preco: number;
  data: string;
  categoria?: string;
  periodicidade?: Periodicidade | null;
  proximaCobranca?: string | null;
}

export interface AtualizarStatusInput {
  pago: boolean;
}
