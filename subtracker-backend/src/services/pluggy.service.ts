import '../config/env';
import { PluggyClient } from 'pluggy-sdk';

import { normalizarData } from '../utils/date.utils';
import { formatarNomeServico } from '../utils/categoria.mapper';
import {
  ehDespesa,
  ehRuidoBancario,
  chaveDescricao,
  hojeIso,
  identificarRecorrencias,
  type RecorrenciaDetectada,
  type TransacaoAnalise,
} from '../utils/heuristica.recorrencia';

const pluggyClient = new PluggyClient({
  clientId: process.env.PLUGGY_CLIENT_ID ?? '',
  clientSecret: process.env.PLUGGY_CLIENT_SECRET ?? '',
});

export interface AnaliseRecorrencia {
  totalContasAnalisadas: number;
  totalTransacoesAnalisadas: number;
  totalRecorrentes: number;
  totalEncerradas: number;
  totalEventuais: number;
  totalParcelas: number;
  recorrentes: RecorrenciaDetectada[];
}

/** Só entram na lista recorrências que ainda cobram (ativas ou pendentes). */
export function resumirAnalise(
  transacoes: TransacaoAnalise[],
  totalContas: number,
  origem: string,
  hoje = hojeIso(),
): AnaliseRecorrencia {
  const analisadas = identificarRecorrencias(transacoes, hoje);
  const padroes = analisadas.filter((item) => item.classificacao === 'recorrente');
  const recorrentes = padroes.filter((item) => item.situacao !== 'encerrada');
  const encerradas = padroes.length - recorrentes.length;
  const parcelas = analisadas.filter((item) => item.parcelaTotal && item.parcelaTotal > 1);
  const totalEventuais = analisadas.length - padroes.length;

  console.log(
    `[${origem}] Análise em memória: ${transacoes.length} transações de ${totalContas} conta(s). Extrato não persistido.`,
  );
  console.log(
    `[${origem}] Recorrentes ativas: ${recorrentes.length}. Encerradas: ${encerradas}. Parcelas: ${parcelas.length}. Eventuais: ${totalEventuais}.`,
  );

  return {
    totalContasAnalisadas: totalContas,
    totalTransacoesAnalisadas: transacoes.length,
    totalRecorrentes: recorrentes.length,
    totalEncerradas: encerradas,
    totalEventuais,
    totalParcelas: parcelas.length,
    recorrentes,
  };
}

export interface LancamentoFatura {
  nome: string;
  data: string;
  valor: number;
}

export interface FaturaMesAtual {
  mes: string;
  cartao: string | null;
  vencimento: string | null;
  total: number;
  minimo: number | null;
  lancamentos: LancamentoFatura[];
}

function lerParcela(transacao: {
  creditCardMetadata?: { installmentNumber?: number; totalInstallments?: number } | null;
}) {
  const meta = transacao.creditCardMetadata;
  if (!meta) return { parcelaAtual: undefined, parcelaTotal: undefined };

  return {
    parcelaAtual: meta.installmentNumber,
    parcelaTotal: meta.totalInstallments,
  };
}

function mapearTransacao(
  transacao: {
    description?: string | null;
    amount?: number | null;
    date: string | Date;
    category?: string | null;
    status?: string;
    merchant?: { name?: string | null } | null;
    creditCardMetadata?: { installmentNumber?: number; totalInstallments?: number } | null;
  },
  tipoConta?: string,
): TransacaoAnalise {
  const parcela = lerParcela(transacao);
  return {
    description: transacao.description ?? '',
    amount: transacao.amount ?? 0,
    date: normalizarData(transacao.date),
    category: transacao.category ?? '',
    tipoConta,
    status: transacao.status,
    parcelaAtual: parcela.parcelaAtual,
    parcelaTotal: parcela.parcelaTotal,
    merchantName: transacao.merchant?.name ?? undefined,
  };
}

function inicioDoMes(hoje = hojeIso()) {
  return `${hoje.slice(0, 7)}-01`;
}

function rotuloMes(hoje = hojeIso()) {
  const data = new Date(`${hoje}T00:00:00`);
  const texto = data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

const PluggyService = {
  async generateConnectToken() {
    const tokenResponse = await pluggyClient.createConnectToken();
    return tokenResponse.accessToken;
  },

  async listarTransacoes(itemId: string): Promise<{ transacoes: TransacaoAnalise[]; totalContas: number }> {
    const accounts = await pluggyClient.fetchAccounts(itemId);

    if (accounts.results.length === 0) {
      throw new Error('Nenhuma conta encontrada para esta conexão');
    }

    const transacoes: TransacaoAnalise[] = [];

    for (const conta of accounts.results) {
      const tipoConta = (conta as { type?: string }).type;
      const brutas = await pluggyClient.fetchAllTransactions(conta.id, {
        from: '2022-01-01',
      });

      for (const transacao of brutas) {
        transacoes.push(mapearTransacao(transacao, tipoConta));
      }
    }

    return { transacoes, totalContas: accounts.results.length };
  },

  async analisarRecorrencias(itemId: string): Promise<AnaliseRecorrencia> {
    const { transacoes, totalContas } = await this.listarTransacoes(itemId);
    return resumirAnalise(transacoes, totalContas, 'PLUGGY');
  },

  async obterFaturaMesAtual(itemId: string): Promise<FaturaMesAtual> {
    const accounts = await pluggyClient.fetchAccounts(itemId);
    const cartoes = accounts.results.filter((conta) => (conta as { type?: string }).type === 'CREDIT');
    const mes = inicioDoMes();
    const hoje = hojeIso();
    const lancamentos: LancamentoFatura[] = [];
    let cartao: string | null = null;
    let vencimento: string | null = null;
    let totalFatura: number | null = null;
    let minimo: number | null = null;

    for (const conta of cartoes) {
      cartao =
        conta.name ||
        (conta as { marketingName?: string }).marketingName ||
        cartao ||
        'Cartão';

      try {
        const faturas = await pluggyClient.fetchCreditCardBills(conta.id, { pageSize: 20 });
        const doMes = faturas.results
          .map((fatura) => ({
            ...fatura,
            vencimento: normalizarData(fatura.dueDate),
          }))
          .filter((fatura) => fatura.vencimento.slice(0, 7) === hoje.slice(0, 7))
          .sort((a, b) => b.vencimento.localeCompare(a.vencimento));
        const atual = doMes[0] ?? [...faturas.results]
          .map((fatura) => ({ ...fatura, vencimento: normalizarData(fatura.dueDate) }))
          .sort((a, b) => b.vencimento.localeCompare(a.vencimento))[0];

        if (atual) {
          vencimento = atual.vencimento;
          totalFatura = Number(atual.totalAmount ?? 0);
          minimo = atual.minimumPaymentAmount == null ? null : Number(atual.minimumPaymentAmount);
        }
      } catch (error) {
        console.warn('[PLUGGY] Fatura do cartão indisponível nesta conta.', error);
      }

      const brutas = await pluggyClient.fetchAllTransactions(conta.id, {
        from: mes,
        to: hoje,
      });

      for (const transacao of brutas) {
        const item = mapearTransacao(transacao, 'CREDIT');
        if (!ehDespesa(item.amount, 'CREDIT')) continue;
        if (ehRuidoBancario(chaveDescricao(item.description))) continue;

        lancamentos.push({
          nome: formatarNomeServico(item.merchantName || item.description),
          data: item.date,
          valor: Math.abs(item.amount),
        });
      }
    }

    lancamentos.sort((a, b) => b.data.localeCompare(a.data));
    const totalLancamentos = lancamentos.reduce((soma, item) => soma + item.valor, 0);

    return {
      mes: rotuloMes(hoje),
      cartao,
      vencimento,
      total: totalFatura ?? totalLancamentos,
      minimo,
      lancamentos,
    };
  },
};

export default PluggyService;
