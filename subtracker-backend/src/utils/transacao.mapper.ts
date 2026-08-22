import { normalizarData } from './date.utils';

export interface TransacaoResposta {
  description: string;
  amount: number;
  date: string;
  category: string;
}

export interface TransacaoPluggy {
  description?: string;
  amount?: number;
  date?: string | Date;
  category?: string | null;
}

interface AssinaturaSalva {
  nome: string;
  preco: number;
  data_transacao: string | Date;
  categoria: string;
}

export function pluggyParaResposta(transacao: TransacaoPluggy): TransacaoResposta {
  return {
    description: transacao.description ?? '',
    amount: transacao.amount ?? 0,
    date: normalizarData(transacao.date),
    category: transacao.category ?? 'Assinatura',
  };
}

export function bancoParaResposta(assinatura: AssinaturaSalva): TransacaoResposta {
  return {
    description: assinatura.nome,
    amount: Number(assinatura.preco),
    date: normalizarData(assinatura.data_transacao),
    category: assinatura.categoria,
  };
}
