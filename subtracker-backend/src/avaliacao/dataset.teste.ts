import type { Classificacao, Periodicidade, TransacaoAnalise } from '../utils/heuristica.recorrencia';

/**
 * Conjunto de teste separado do gabarito de desenvolvimento (dataset.recorrencia.ts).
 * Gerado por semente fixa; o rótulo vem do tipo de cenário (tabela ROTULO_DO_CENARIO),
 * nunca da saída do algoritmo. Não alterar cenários, catálogo ou semente depois de
 * observar o resultado: isso anularia o caráter de teste.
 */

export const SEMENTE_TESTE = 2026;
export const PERFIS_TESTE = 10;
export const INICIO_PERIODO = { ano: 2025, mes: 0 };
export const MESES_NO_PERIODO = 13;

export type Cenario =
  | 'R1_assinatura_fixa'
  | 'R2_assinatura_reajuste'
  | 'R3_assinatura_mes_falho'
  | 'R4_consumo_valor_variavel'
  | 'R5_anual'
  | 'R6_bimestral'
  | 'R7_pix_de_conta'
  | 'R8_assinatura_recente'
  | 'R9_assinatura_cancelada'
  | 'E1_frequente_valor_irregular'
  | 'E2_compra_unica'
  | 'E3_pix_para_pessoa'
  | 'E4_parcelamento'
  | 'E5_pagamento_fatura'
  | 'E6_mesmo_valor_datas_irregulares'
  | 'E7_ted_irregular';

export const ROTULO_DO_CENARIO: Record<Cenario, { esperado: Classificacao; periodicidade?: Periodicidade }> = {
  R1_assinatura_fixa: { esperado: 'recorrente', periodicidade: 'mensal' },
  R2_assinatura_reajuste: { esperado: 'recorrente', periodicidade: 'mensal' },
  R3_assinatura_mes_falho: { esperado: 'recorrente', periodicidade: 'mensal' },
  R4_consumo_valor_variavel: { esperado: 'recorrente', periodicidade: 'mensal' },
  R5_anual: { esperado: 'recorrente', periodicidade: 'anual' },
  R6_bimestral: { esperado: 'recorrente', periodicidade: 'bimestral' },
  R7_pix_de_conta: { esperado: 'recorrente', periodicidade: 'mensal' },
  R8_assinatura_recente: { esperado: 'recorrente', periodicidade: 'mensal' },
  R9_assinatura_cancelada: { esperado: 'recorrente', periodicidade: 'mensal' },
  E1_frequente_valor_irregular: { esperado: 'eventual' },
  E2_compra_unica: { esperado: 'eventual' },
  E3_pix_para_pessoa: { esperado: 'eventual' },
  E4_parcelamento: { esperado: 'eventual' },
  E5_pagamento_fatura: { esperado: 'eventual' },
  E6_mesmo_valor_datas_irregulares: { esperado: 'eventual' },
  E7_ted_irregular: { esperado: 'eventual' },
};

export interface CasoTeste {
  perfil: string;
  nome: string;
  cenario: Cenario;
  esperado: Classificacao;
  periodicidadeEsperada?: Periodicidade;
  transacoes: TransacaoAnalise[];
}

export interface PerfilTeste {
  nome: string;
  casos: CasoTeste[];
  ruido: TransacaoAnalise[];
}

interface ItemCatalogo {
  descricao: string;
  valor: number;
  categoria: string;
}

const ASSINATURAS: ItemCatalogo[] = [
  { descricao: 'NETFLIX.COM', valor: 44.9, categoria: 'Subscriptions' },
  { descricao: 'SPOTIFY', valor: 21.9, categoria: 'Subscriptions' },
  { descricao: 'DISNEY PLUS', valor: 33.9, categoria: 'Subscriptions' },
  { descricao: 'HBOMAX', valor: 34.9, categoria: 'Subscriptions' },
  { descricao: 'AMAZON PRIME BR', valor: 19.9, categoria: 'Subscriptions' },
  { descricao: 'YOUTUBE PREMIUM', valor: 24.9, categoria: 'Subscriptions' },
  { descricao: 'DEEZER', valor: 22.9, categoria: 'Subscriptions' },
  { descricao: 'GLOBOPLAY', valor: 24.9, categoria: 'Subscriptions' },
  { descricao: 'APPLE.COM/BILL', valor: 9.9, categoria: 'Subscriptions' },
  { descricao: 'GOOGLE ONE', valor: 9.99, categoria: 'Subscriptions' },
  { descricao: 'MICROSOFT 365', valor: 45, categoria: 'Subscriptions' },
  { descricao: 'CANVA PRO', valor: 34.9, categoria: 'Subscriptions' },
  { descricao: 'DUOLINGO', valor: 29.9, categoria: 'Subscriptions' },
  { descricao: 'OPENAI CHATGPT', valor: 110, categoria: 'Subscriptions' },
  { descricao: 'SMART FIT', valor: 119.9, categoria: 'Sports' },
  { descricao: 'WELLHUB', valor: 149.9, categoria: 'Sports' },
  { descricao: 'CLARO FIBRA', valor: 99.9, categoria: 'Telecommunications' },
  { descricao: 'VIVO FIBRA', valor: 109.99, categoria: 'Telecommunications' },
  { descricao: 'TIM CONTROLE', valor: 54.99, categoria: 'Telecommunications' },
];

const CONSUMO_VARIAVEL: ItemCatalogo[] = [
  { descricao: 'ENEL DISTRIBUICAO CE', valor: 180, categoria: 'Utilities' },
  { descricao: 'CAGECE AGUA E ESGOTO', valor: 85, categoria: 'Utilities' },
  { descricao: 'COMPANHIA DE GAS', valor: 70, categoria: 'Utilities' },
];

const ANUAIS: ItemCatalogo[] = [
  { descricao: 'PORTO SEGURO AUTO', valor: 1450, categoria: 'Insurance' },
  { descricao: 'KASPERSKY ANUAL', valor: 129.9, categoria: 'Subscriptions' },
  { descricao: 'DOMINIO REGISTRO.BR', valor: 40, categoria: 'Services' },
];

const BIMESTRAIS: ItemCatalogo[] = [
  { descricao: 'CLUBE DO VINHO', valor: 139.9, categoria: 'Shopping' },
  { descricao: 'DEDETIZADORA LIMPA', valor: 120, categoria: 'Services' },
];

const PIX_DE_CONTA: ItemCatalogo[] = [
  { descricao: 'PIX ALUGUEL APTO 302', valor: 1200, categoria: 'Transfer' },
  { descricao: 'PIX CONDOMINIO RES AURORA', valor: 380, categoria: 'Transfer' },
  { descricao: 'PIX MENSALIDADE ESCOLA', valor: 650, categoria: 'Transfer' },
];

const FREQUENTES: ItemCatalogo[] = [
  { descricao: 'IFOOD', valor: 45, categoria: 'Food' },
  { descricao: 'UBER TRIP', valor: 22, categoria: 'Transport' },
  { descricao: '99APP', valor: 18, categoria: 'Transport' },
  { descricao: 'SUPERMERCADO PAO DE ACUCAR', valor: 160, categoria: 'Groceries' },
  { descricao: 'FARMACIA PAGUE MENOS', valor: 55, categoria: 'Pharmacy' },
  { descricao: 'PADARIA SAO JOSE', valor: 15, categoria: 'Food' },
  { descricao: 'RAPPI', valor: 50, categoria: 'Food' },
];

const COMPRAS_UNICAS: ItemCatalogo[] = [
  { descricao: 'MAGAZINE LUIZA', valor: 890, categoria: 'Shopping' },
  { descricao: 'KABUM', valor: 450, categoria: 'Shopping' },
  { descricao: 'AMAZON MARKETPLACE', valor: 130, categoria: 'Shopping' },
  { descricao: 'NETSHOES', valor: 280, categoria: 'Shopping' },
  { descricao: 'CINEMARK', valor: 64, categoria: 'Leisure' },
];

const MESMO_VALOR: ItemCatalogo[] = [
  { descricao: 'POSTO IPIRANGA', valor: 100, categoria: 'Transport' },
  { descricao: 'ESTACIONAMENTO SHOPPING', valor: 12, categoria: 'Transport' },
  { descricao: 'RECARGA BILHETE UNICO', valor: 50, categoria: 'Transport' },
];

const PESSOAS = ['JOAO PEREIRA', 'MARIA OLIVEIRA', 'ANA SOUZA', 'CARLOS LIMA', 'LUCAS ALVES'];
const LOJAS_PARCELA = ['CASAS BAHIA', 'LOJAS AMERICANAS', 'FAST SHOP', 'DECATHLON', 'LEROY MERLIN'];

function mulberry32(semente: number) {
  let estado = semente >>> 0;
  return () => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Aleatorio = ReturnType<typeof mulberry32>;

function inteiro(rnd: Aleatorio, min: number, max: number): number {
  return min + Math.floor(rnd() * (max - min + 1));
}

function real(rnd: Aleatorio, min: number, max: number): number {
  return min + rnd() * (max - min);
}

function dinheiro(valor: number): number {
  return Math.round(valor * 100) / 100;
}

function embaralhar<T>(rnd: Aleatorio, lista: T[]): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = inteiro(rnd, 0, i);
    const a = copia[i] as T;
    copia[i] = copia[j] as T;
    copia[j] = a;
  }
  return copia;
}

function formatar(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

/** Data no mês de índice `indiceMes` (0 = início do período), com deslocamento em dias. */
function dataNoMes(indiceMes: number, dia: number | 'fim', deslocamento = 0): string {
  const ano = INICIO_PERIODO.ano;
  const mes = INICIO_PERIODO.mes + indiceMes;
  const base =
    dia === 'fim' ? new Date(ano, mes + 1, 0) : new Date(ano, mes, Math.min(dia, new Date(ano, mes + 1, 0).getDate()));
  base.setDate(base.getDate() + deslocamento);
  return formatar(base);
}

function dataAleatoria(rnd: Aleatorio): string {
  const inicio = new Date(INICIO_PERIODO.ano, INICIO_PERIODO.mes, 1).getTime();
  const fim = new Date(INICIO_PERIODO.ano, INICIO_PERIODO.mes + MESES_NO_PERIODO, 0).getTime();
  return formatar(new Date(inicio + rnd() * (fim - inicio)));
}

/** Sufixo numérico comum em descritores de cartão (ex.: "NETFLIX.COM 4471"). */
function descritor(rnd: Aleatorio, descricao: string, cartao: boolean): string {
  if (cartao && rnd() < 0.3) return `${descricao} ${inteiro(rnd, 1000, 9999)}`;
  return descricao;
}

function lancamento(
  item: ItemCatalogo,
  data: string,
  valor: number,
  cartao: boolean,
  descricao = item.descricao,
): TransacaoAnalise {
  return cartao
    ? { description: descricao, amount: dinheiro(valor), date: data, category: item.categoria, tipoConta: 'CREDIT' }
    : { description: descricao, amount: -dinheiro(valor), date: data, category: item.categoria };
}

function mensal(
  rnd: Aleatorio,
  item: ItemCatalogo,
  meses: number[],
  opcoes: { cartao: boolean; valor: (indice: number) => number; deslocamentoMax: number },
): TransacaoAnalise[] {
  const dia: number | 'fim' = rnd() < 0.1 ? 'fim' : inteiro(rnd, 1, 28);
  return meses.map((mes, indice) =>
    lancamento(
      item,
      dataNoMes(mes, dia, inteiro(rnd, 0, opcoes.deslocamentoMax)),
      opcoes.valor(indice),
      opcoes.cartao,
      descritor(rnd, item.descricao, opcoes.cartao),
    ),
  );
}

function intervalo(inicio: number, fim: number, passo = 1): number[] {
  const meses: number[] = [];
  for (let m = inicio; m <= fim; m += passo) meses.push(m);
  return meses;
}

const ULTIMO_MES = MESES_NO_PERIODO - 1;

function gerarRecorrente(rnd: Aleatorio, cenario: Cenario, item: ItemCatalogo): TransacaoAnalise[] {
  const cartao = rnd() < 0.5;

  switch (cenario) {
    case 'R1_assinatura_fixa':
      return mensal(rnd, item, intervalo(inteiro(rnd, 0, 5), ULTIMO_MES), {
        cartao,
        valor: () => item.valor,
        deslocamentoMax: 2,
      });
    case 'R2_assinatura_reajuste': {
      const meses = intervalo(inteiro(rnd, 0, 3), ULTIMO_MES);
      const virada = inteiro(rnd, 3, meses.length - 3);
      const fator = real(rnd, 1.08, 1.2);
      return mensal(rnd, item, meses, {
        cartao,
        valor: (i) => (i >= virada ? item.valor * fator : item.valor),
        deslocamentoMax: 2,
      });
    }
    case 'R3_assinatura_mes_falho': {
      const meses = intervalo(inteiro(rnd, 0, 3), ULTIMO_MES);
      meses.splice(inteiro(rnd, 2, meses.length - 3), 1);
      return mensal(rnd, item, meses, { cartao, valor: () => item.valor, deslocamentoMax: 2 });
    }
    case 'R4_consumo_valor_variavel':
      return mensal(rnd, item, intervalo(0, ULTIMO_MES), {
        cartao: false,
        valor: () => item.valor * real(rnd, 0.75, 1.3),
        deslocamentoMax: 4,
      });
    case 'R5_anual': {
      const dia = inteiro(rnd, 1, 28);
      const fator = real(rnd, 1, 1.12);
      return [
        lancamento(item, dataNoMes(0, dia, inteiro(rnd, 0, 3)), item.valor, cartao),
        lancamento(item, dataNoMes(12, dia, inteiro(rnd, 0, 3)), item.valor * fator, cartao),
      ];
    }
    case 'R6_bimestral':
      return mensal(rnd, item, intervalo(inteiro(rnd, 0, 1), ULTIMO_MES, 2), {
        cartao,
        valor: () => item.valor,
        deslocamentoMax: 2,
      });
    case 'R7_pix_de_conta':
      return mensal(rnd, item, intervalo(inteiro(rnd, 0, 3), ULTIMO_MES), {
        cartao: false,
        valor: () => item.valor,
        deslocamentoMax: 3,
      });
    case 'R8_assinatura_recente':
      return mensal(rnd, item, [ULTIMO_MES - 1, ULTIMO_MES], {
        cartao,
        valor: () => item.valor,
        deslocamentoMax: 2,
      });
    case 'R9_assinatura_cancelada': {
      const inicio = inteiro(rnd, 0, 3);
      return mensal(rnd, item, intervalo(inicio, inicio + 4), {
        cartao,
        valor: () => item.valor,
        deslocamentoMax: 2,
      });
    }
    default:
      return [];
  }
}

function gerarEventual(rnd: Aleatorio, cenario: Cenario, item: ItemCatalogo): TransacaoAnalise[] {
  switch (cenario) {
    case 'E1_frequente_valor_irregular': {
      const cartao = rnd() < 0.5;
      return Array.from({ length: inteiro(rnd, 4, 12) }, () =>
        lancamento(item, dataAleatoria(rnd), item.valor * real(rnd, 0.4, 2), cartao),
      );
    }
    case 'E2_compra_unica':
      return [lancamento(item, dataAleatoria(rnd), item.valor, rnd() < 0.5)];
    case 'E3_pix_para_pessoa': {
      const inicio = inteiro(rnd, 0, 8);
      return mensal(rnd, item, intervalo(inicio, ULTIMO_MES), {
        cartao: false,
        valor: () => item.valor,
        deslocamentoMax: 2,
      });
    }
    case 'E4_parcelamento': {
      const total = [3, 6, 10, 12][inteiro(rnd, 0, 3)] ?? 6;
      const inicio = inteiro(rnd, 0, ULTIMO_MES - 2);
      const observadas = Math.min(total, MESES_NO_PERIODO - inicio);
      const dia = inteiro(rnd, 1, 28);
      const comMetadado = rnd() < 0.5;
      return Array.from({ length: observadas }, (_, i) => ({
        description: `${item.descricao} ${i + 1}/${total}`,
        amount: dinheiro(item.valor),
        date: dataNoMes(inicio + i, dia),
        category: item.categoria,
        tipoConta: 'CREDIT',
        ...(comMetadado ? { parcelaAtual: i + 1, parcelaTotal: total } : {}),
      }));
    }
    case 'E5_pagamento_fatura':
      return mensal(rnd, item, intervalo(0, ULTIMO_MES), {
        cartao: false,
        valor: () => real(rnd, 600, 2500),
        deslocamentoMax: 1,
      });
    case 'E6_mesmo_valor_datas_irregulares': {
      const cartao = rnd() < 0.5;
      const lista: TransacaoAnalise[] = [];
      const atual = new Date(INICIO_PERIODO.ano, INICIO_PERIODO.mes + inteiro(rnd, 0, 8), inteiro(rnd, 1, 28));
      const quantidade = inteiro(rnd, 5, 9);
      for (let i = 0; i < quantidade; i += 1) {
        lista.push(lancamento(item, formatar(atual), item.valor, cartao));
        atual.setDate(atual.getDate() + inteiro(rnd, 3, 20));
      }
      return lista;
    }
    case 'E7_ted_irregular':
      return Array.from({ length: inteiro(rnd, 2, 4) }, () =>
        lancamento(item, dataAleatoria(rnd), item.valor * real(rnd, 0.5, 3), false),
      );
    default:
      return [];
  }
}

function itemDoCenario(cenario: Cenario, rnd: Aleatorio, usados: Set<string>, indicePerfil: number): ItemCatalogo {
  const pessoa = PESSOAS[indicePerfil % PESSOAS.length] ?? 'FULANO';
  const loja = LOJAS_PARCELA[indicePerfil % LOJAS_PARCELA.length] ?? 'LOJA';

  const fixos: Partial<Record<Cenario, ItemCatalogo>> = {
    E3_pix_para_pessoa: { descricao: `PIX TRANSF ${pessoa}`, valor: inteiro(rnd, 2, 8) * 50, categoria: 'Transfer' },
    E4_parcelamento: { descricao: loja, valor: dinheiro(real(rnd, 60, 400)), categoria: 'Shopping' },
    E5_pagamento_fatura: { descricao: 'PAGAMENTO FATURA CARTAO', valor: 0, categoria: 'Credit card payment' },
    E7_ted_irregular: { descricao: `TED ENVIADO ${pessoa}`, valor: 300, categoria: 'Transfer' },
  };
  const fixo = fixos[cenario];
  if (fixo) return fixo;

  const pools: Partial<Record<Cenario, ItemCatalogo[]>> = {
    R1_assinatura_fixa: ASSINATURAS,
    R2_assinatura_reajuste: ASSINATURAS,
    R3_assinatura_mes_falho: ASSINATURAS,
    R8_assinatura_recente: ASSINATURAS,
    R9_assinatura_cancelada: ASSINATURAS,
    R4_consumo_valor_variavel: CONSUMO_VARIAVEL,
    R5_anual: ANUAIS,
    R6_bimestral: BIMESTRAIS,
    R7_pix_de_conta: PIX_DE_CONTA,
    E1_frequente_valor_irregular: FREQUENTES,
    E2_compra_unica: COMPRAS_UNICAS,
    E6_mesmo_valor_datas_irregulares: MESMO_VALOR,
  };
  const livre = embaralhar(rnd, pools[cenario] ?? []).find((item) => !usados.has(item.descricao));
  if (!livre) throw new Error(`Catálogo esgotado para ${cenario}`);
  usados.add(livre.descricao);
  return livre;
}

const RECORRENTES_EXTRAS: Cenario[] = [
  'R5_anual',
  'R6_bimestral',
  'R7_pix_de_conta',
  'R8_assinatura_recente',
  'R9_assinatura_cancelada',
];
const EVENTUAIS_EXTRAS: Cenario[] = [
  'E3_pix_para_pessoa',
  'E4_parcelamento',
  'E5_pagamento_fatura',
  'E7_ted_irregular',
];

/** 6 recorrentes e 6 eventuais por perfil; os extras giram entre perfis para cobrir todos os cenários. */
function cenariosDoPerfil(indice: number): Cenario[] {
  const r = RECORRENTES_EXTRAS;
  const e = EVENTUAIS_EXTRAS;
  return [
    'R1_assinatura_fixa',
    'R2_assinatura_reajuste',
    'R3_assinatura_mes_falho',
    'R4_consumo_valor_variavel',
    r[(2 * indice) % r.length] as Cenario,
    r[(2 * indice + 1) % r.length] as Cenario,
    'E1_frequente_valor_irregular',
    'E1_frequente_valor_irregular',
    'E2_compra_unica',
    'E6_mesmo_valor_datas_irregulares',
    e[(2 * indice) % e.length] as Cenario,
    e[(2 * indice + 1) % e.length] as Cenario,
  ];
}

export function gerarConjuntoTeste(semente = SEMENTE_TESTE, quantidade = PERFIS_TESTE): PerfilTeste[] {
  const rnd = mulberry32(semente);
  const perfis: PerfilTeste[] = [];

  for (let p = 0; p < quantidade; p += 1) {
    const nome = `Perfil ${String(p + 1).padStart(2, '0')}`;
    const usados = new Set<string>();
    const casos: CasoTeste[] = cenariosDoPerfil(p).map((cenario) => {
      const item = itemDoCenario(cenario, rnd, usados, p);
      const rotulo = ROTULO_DO_CENARIO[cenario];
      const transacoes = cenario.startsWith('R')
        ? gerarRecorrente(rnd, cenario, item)
        : gerarEventual(rnd, cenario, item);
      return {
        perfil: nome,
        nome: item.descricao,
        cenario,
        esperado: rotulo.esperado,
        periodicidadeEsperada: rotulo.periodicidade,
        transacoes,
      };
    });

    const diaSalario = inteiro(rnd, 1, 10);
    const salario = inteiro(rnd, 20, 90) * 100;
    const ruido = intervalo(0, ULTIMO_MES).map((mes) => ({
      description: 'SALARIO',
      amount: salario,
      date: dataNoMes(mes, diaSalario),
      category: 'Income',
    }));

    perfis.push({ nome, casos, ruido });
  }

  return perfis;
}
