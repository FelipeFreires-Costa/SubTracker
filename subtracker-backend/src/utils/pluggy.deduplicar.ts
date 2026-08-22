import type { TransacaoResposta } from './transacao.mapper';
import { formatarNomeServico, normalizarNome } from './categoria.mapper';

export function deduplicarTransacoes(transacoes: TransacaoResposta[]): TransacaoResposta[] {
  const mapa = new Map<string, TransacaoResposta>();

  for (const transacao of transacoes) {
    const chave = normalizarNome(transacao.description);
    const atual = mapa.get(chave);
    const dataAtual = atual ? new Date(atual.date).getTime() : 0;
    const dataNova = new Date(transacao.date).getTime();

    if (!atual || dataNova > dataAtual) {
      mapa.set(chave, {
        ...transacao,
        description: formatarNomeServico(transacao.description),
        amount: Math.abs(transacao.amount),
      });
    }
  }

  return Array.from(mapa.values());
}
