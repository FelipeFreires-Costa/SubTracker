import '../config/env';
import { PluggyClient } from 'pluggy-sdk';

import { formatarDataLocal, normalizarData } from '../utils/date.utils';
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

export interface PeriodoFatura {
  chave: string;
  rotulo: string;
  vencimento: string | null;
  papel: 'anterior' | 'atual' | 'proxima';
}

export interface FaturaMesAtual {
  mes: string;
  mesChave: string;
  cartao: string | null;
  vencimento: string | null;
  total: number;
  minimo: number | null;
  lancamentos: LancamentoFatura[];
  periodos: PeriodoFatura[];
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

/**
 * Pluggy: em compra internacional, `amount` vem na moeda da cobrança (ex.: USD 20)
 * e `amountInAccountCurrency` na moeda da conta (ex.: BRL 130,48). Sem isso,
 * assinaturas como Cursor aparecem com o valor em dólar tratado como real.
 */
function valorNaMoedaDaConta(transacao: {
  amount?: number | null;
  amountInAccountCurrency?: number | null;
}) {
  if (
    transacao.amountInAccountCurrency != null &&
    Number.isFinite(transacao.amountInAccountCurrency)
  ) {
    return transacao.amountInAccountCurrency;
  }
  return transacao.amount ?? 0;
}

function mapearTransacao(
  transacao: {
    description?: string | null;
    amount?: number | null;
    amountInAccountCurrency?: number | null;
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
    amount: valorNaMoedaDaConta(transacao),
    date: normalizarData(transacao.date),
    category: transacao.category ?? '',
    tipoConta,
    status: transacao.status,
    parcelaAtual: parcela.parcelaAtual,
    parcelaTotal: parcela.parcelaTotal,
    merchantName: transacao.merchant?.name ?? undefined,
  };
}

function chaveDoMes(iso: string) {
  return iso.slice(0, 7);
}

function inicioDoMes(chaveOuDia = hojeIso()) {
  return `${chaveDoMes(chaveOuDia)}-01`;
}

function rotuloMes(chaveOuDia = hojeIso()) {
  const chave = chaveDoMes(chaveOuDia);
  const data = new Date(`${chave}-01T00:00:00`);
  const texto = data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function rotuloMesCurto(chave: string) {
  const data = new Date(`${chave}-01T00:00:00`);
  const texto = data.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
  return texto.replace('.', '').replace(' de ', '/');
}

function adicionarMeses(isoDia: string, meses: number) {
  const data = new Date(`${isoDia.slice(0, 10)}T00:00:00`);
  data.setMonth(data.getMonth() + meses);
  return formatarDataLocal(data);
}

function adicionarDias(isoDia: string, dias: number) {
  const data = new Date(`${isoDia.slice(0, 10)}T00:00:00`);
  data.setDate(data.getDate() + dias);
  return formatarDataLocal(data);
}

function papelDoPeriodo(chave: string, hoje = hojeIso()): PeriodoFatura['papel'] {
  const atual = chaveDoMes(hoje);
  if (chave > atual) return 'proxima';
  if (chave === atual) return 'atual';
  return 'anterior';
}

type FaturaPluggyResumo = {
  chave: string;
  vencimento: string;
  total: number;
  minimo: number | null;
  from: string;
  to: string;
};

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

  async obterFaturaMesAtual(itemId: string, mesChave?: string | null): Promise<FaturaMesAtual> {
    const accounts = await pluggyClient.fetchAccounts(itemId);
    const cartoes = accounts.results.filter((conta) => (conta as { type?: string }).type === 'CREDIT');
    const hoje = hojeIso();
    const mesAtual = chaveDoMes(hoje);
    const mesProximo = chaveDoMes(adicionarMeses(hoje, 1));

    let cartao: string | null = null;
    const resumosPorChave = new Map<string, FaturaPluggyResumo>();
    const todosLancamentos: LancamentoFatura[] = [];

    const janelaFrom = inicioDoMes(adicionarMeses(hoje, -4));
    const janelaTo = adicionarMeses(inicioDoMes(hoje), 2);

    for (const conta of cartoes) {
      cartao =
        conta.name ||
        (conta as { marketingName?: string }).marketingName ||
        cartao ||
        'Cartão';

      const vencimentosBrutos: Array<{
        vencimento: string;
        total: number;
        minimo: number | null;
      }> = [];

      try {
        const faturas = await pluggyClient.fetchCreditCardBills(conta.id, { pageSize: 24 });
        for (const fatura of faturas.results) {
          const vencimento = normalizarData(fatura.dueDate);
          if (!vencimento) continue;
          vencimentosBrutos.push({
            vencimento,
            total: Number(fatura.totalAmount ?? 0),
            minimo:
              fatura.minimumPaymentAmount == null ? null : Number(fatura.minimumPaymentAmount),
          });
        }
      } catch (error) {
        console.warn('[PLUGGY] Fatura do cartão indisponível nesta conta.', error);
      }

      vencimentosBrutos.sort((a, b) => a.vencimento.localeCompare(b.vencimento));

      for (let i = 0; i < vencimentosBrutos.length; i += 1) {
        const atual = vencimentosBrutos[i];
        if (!atual) continue;
        const anterior = vencimentosBrutos[i - 1];
        const from = anterior
          ? adicionarDias(anterior.vencimento, 1)
          : inicioDoMes(adicionarMeses(atual.vencimento, -1));
        const to = atual.vencimento > hoje ? hoje : atual.vencimento;
        const chave = chaveDoMes(atual.vencimento);
        const existente = resumosPorChave.get(chave);

        // Se houver mais de um cartão no mesmo mês, soma os totais.
        resumosPorChave.set(chave, {
          chave,
          vencimento: atual.vencimento,
          total: (existente?.total ?? 0) + atual.total,
          minimo:
            atual.minimo == null
              ? existente?.minimo ?? null
              : (existente?.minimo ?? 0) + atual.minimo,
          from: existente && existente.from < from ? existente.from : from,
          to: existente && existente.to > to ? existente.to : to,
        });
      }

      const brutas = await pluggyClient.fetchAllTransactions(conta.id, {
        from: janelaFrom,
        to: janelaTo,
      });

      for (const transacao of brutas) {
        const item = mapearTransacao(transacao, 'CREDIT');
        if (!ehDespesa(item.amount, 'CREDIT')) continue;
        if (ehRuidoBancario(chaveDescricao(item.description))) continue;

        todosLancamentos.push({
          nome: formatarNomeServico(item.merchantName || item.description),
          data: item.date,
          valor: Math.abs(item.amount),
        });
      }
    }

    // Garante abas do mês atual e do próximo (estilo app de fatura).
    const ultimaConhecida = [...resumosPorChave.values()].sort((a, b) =>
      b.vencimento.localeCompare(a.vencimento),
    )[0];

    if (!resumosPorChave.has(mesAtual)) {
      const vencimento = ultimaConhecida
        ? adicionarMeses(ultimaConhecida.vencimento, mesAtual > chaveDoMes(ultimaConhecida.vencimento) ? 1 : 0)
        : `${mesAtual}-01`;
      resumosPorChave.set(mesAtual, {
        chave: mesAtual,
        vencimento,
        total: 0,
        minimo: null,
        from: inicioDoMes(adicionarMeses(`${mesAtual}-01`, -1)),
        to: hoje,
      });
    }

    if (!resumosPorChave.has(mesProximo)) {
      const base = resumosPorChave.get(mesAtual) ?? ultimaConhecida;
      const vencimento = base ? adicionarMeses(base.vencimento, 1) : `${mesProximo}-01`;
      const from = base ? adicionarDias(base.vencimento, 1) : inicioDoMes(mesAtual);
      resumosPorChave.set(mesProximo, {
        chave: mesProximo,
        vencimento,
        total: 0,
        minimo: null,
        from,
        to: hoje,
      });
    }

    const periodosOrdenados = [...resumosPorChave.values()].sort((a, b) =>
      a.chave.localeCompare(b.chave),
    );

    const periodosCompletos: PeriodoFatura[] = periodosOrdenados.map((item) => ({
      chave: item.chave,
      rotulo: rotuloMesCurto(item.chave),
      vencimento: item.vencimento,
      papel: papelDoPeriodo(item.chave, hoje),
    }));

    const foco = periodosCompletos.filter((p) => p.papel !== 'anterior');
    const anteriores = periodosCompletos.filter((p) => p.papel === 'anterior').slice(-3);
    const periodos = [...anteriores, ...foco];

    const preferida =
      periodos.find((p) => p.papel === 'proxima')?.chave ??
      periodos.find((p) => p.papel === 'atual')?.chave ??
      periodos[periodos.length - 1]?.chave ??
      mesAtual;

    const chaveSelecionada =
      mesChave && resumosPorChave.has(mesChave) ? mesChave : preferida;
    const selecionada = resumosPorChave.get(chaveSelecionada) ?? {
      chave: chaveSelecionada,
      vencimento: null as string | null,
      total: 0,
      minimo: null as number | null,
      from: inicioDoMes(chaveSelecionada),
      to: hoje,
    };

    const lancamentos = todosLancamentos
      .filter((item) => item.data >= selecionada.from && item.data <= selecionada.to)
      .sort((a, b) => b.data.localeCompare(a.data));

    const totalLancamentos = lancamentos.reduce((soma, item) => soma + item.valor, 0);
    const total =
      selecionada.total > 0
        ? selecionada.total
        : totalLancamentos;

    return {
      mes: rotuloMes(chaveSelecionada),
      mesChave: chaveSelecionada,
      cartao,
      vencimento: selecionada.vencimento,
      total,
      minimo: selecionada.minimo,
      lancamentos,
      periodos,
    };
  },
};

export default PluggyService;
