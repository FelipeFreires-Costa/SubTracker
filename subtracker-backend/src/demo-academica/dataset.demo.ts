import type { Classificacao, Periodicidade, TransacaoAnalise } from '../utils/heuristica.recorrencia';

/**
 * Conjunto determinístico só para a Demonstração Acadêmica (em memória).
 * Não grava no banco e não altera o gabarito N=21 nem o held-out 2027.
 */
export interface CasoDemo {
  id: string;
  nome: string;
  esperado: Classificacao;
  periodicidadeEsperada?: Periodicidade;
  transacoes: TransacaoAnalise[];
}

export const CASOS_DEMO: CasoDemo[] = [
  {
    id: 'spotify',
    nome: 'Spotify',
    esperado: 'recorrente',
    periodicidadeEsperada: 'mensal',
    transacoes: [
      { description: 'SPOTIFY', amount: 21.9, date: '2026-05-05', category: 'Subscriptions', tipoConta: 'CREDIT' },
      { description: 'SPOTIFY', amount: 21.9, date: '2026-06-05', category: 'Subscriptions', tipoConta: 'CREDIT' },
      { description: 'SPOTIFY', amount: 21.9, date: '2026-07-05', category: 'Subscriptions', tipoConta: 'CREDIT' },
    ],
  },
  {
    id: 'netflix',
    nome: 'Netflix',
    esperado: 'recorrente',
    periodicidadeEsperada: 'mensal',
    transacoes: [
      { description: 'NETFLIX.COM', amount: -55.9, date: '2026-04-10', category: 'Subscriptions' },
      { description: 'Netflix', amount: -55.9, date: '2026-05-10', category: 'Subscriptions' },
      { description: 'NETFLIX', amount: -55.9, date: '2026-06-10', category: 'Subscriptions' },
      { description: 'NETFLIX', amount: -55.9, date: '2026-07-10', category: 'Subscriptions' },
    ],
  },
  {
    id: 'enel',
    nome: 'Energia elétrica (Enel)',
    esperado: 'recorrente',
    periodicidadeEsperada: 'mensal',
    transacoes: [
      { description: 'ENEL DISTRIBUICAO CE', amount: -180.4, date: '2026-03-12', category: 'Electricity' },
      { description: 'ENEL DISTRIBUICAO CE', amount: -212.9, date: '2026-04-12', category: 'Electricity' },
      { description: 'ENEL DISTRIBUICAO CE', amount: -165.3, date: '2026-05-12', category: 'Electricity' },
      { description: 'ENEL DISTRIBUICAO CE', amount: -238.1, date: '2026-06-12', category: 'Electricity' },
      { description: 'ENEL DISTRIBUICAO CE', amount: -199.0, date: '2026-07-12', category: 'Electricity' },
    ],
  },
  {
    id: 'academia',
    nome: 'Academia Body Tech',
    esperado: 'recorrente',
    periodicidadeEsperada: 'mensal',
    transacoes: [
      { description: 'ACADEMIA BODY TECH', amount: -149.9, date: '2026-04-17', category: 'Sports' },
      { description: 'ACADEMIA BODY TECH', amount: -149.9, date: '2026-05-17', category: 'Sports' },
      { description: 'ACADEMIA BODY TECH', amount: -149.9, date: '2026-06-17', category: 'Sports' },
      { description: 'ACADEMIA BODY TECH', amount: -149.9, date: '2026-07-17', category: 'Sports' },
    ],
  },
  {
    id: 'smartfit',
    nome: 'Smart Fit',
    esperado: 'recorrente',
    periodicidadeEsperada: 'bimestral',
    transacoes: [
      { description: 'SMART FIT', amount: -119.9, date: '2026-02-01', category: 'Sports' },
      { description: 'SMART FIT', amount: -119.9, date: '2026-04-02', category: 'Sports' },
      { description: 'SMART FIT', amount: -119.9, date: '2026-06-01', category: 'Sports' },
    ],
  },
  {
    id: 'seguro',
    nome: 'Seguro auto',
    esperado: 'recorrente',
    periodicidadeEsperada: 'anual',
    transacoes: [
      { description: 'PORTO SEGURO AUTO', amount: -1240, date: '2025-03-01', category: 'Insurance' },
      { description: 'PORTO SEGURO AUTO', amount: -1240, date: '2026-03-01', category: 'Insurance' },
    ],
  },
  {
    id: 'chatgpt',
    nome: 'OpenAI ChatGPT',
    esperado: 'recorrente',
    periodicidadeEsperada: 'mensal',
    transacoes: [
      { description: 'OPENAI CHATGPT SUBSCR', amount: 104.9, date: '2026-06-19', category: 'Subscriptions', tipoConta: 'CREDIT' },
      { description: 'OPENAI CHATGPT SUBSCR', amount: 104.9, date: '2026-07-19', category: 'Subscriptions', tipoConta: 'CREDIT' },
    ],
  },
  {
    id: 'condominio',
    nome: 'PIX condomínio',
    esperado: 'recorrente',
    periodicidadeEsperada: 'mensal',
    transacoes: [
      { description: 'PIX CONDOMINIO EDIFICIO SOLAR', amount: -450, date: '2026-05-05', category: 'Utilities' },
      { description: 'PIX CONDOMINIO EDIFICIO SOLAR', amount: -450, date: '2026-06-05', category: 'Utilities' },
      { description: 'PIX CONDOMINIO EDIFICIO SOLAR', amount: -450, date: '2026-07-05', category: 'Utilities' },
    ],
  },
  {
    id: 'supermercado',
    nome: 'Supermercado Extra',
    esperado: 'eventual',
    transacoes: [
      { description: 'SUPERMERCADO EXTRA', amount: -86.4, date: '2026-07-05', category: 'Groceries' },
      { description: 'SUPERMERCADO EXTRA', amount: -210.15, date: '2026-07-12', category: 'Groceries' },
      { description: 'SUPERMERCADO EXTRA', amount: -54.9, date: '2026-07-19', category: 'Groceries' },
    ],
  },
  {
    id: 'ifood',
    nome: 'iFood',
    esperado: 'eventual',
    transacoes: [
      { description: 'IFOOD', amount: -32.5, date: '2026-07-01', category: 'Food' },
      { description: 'IFOOD', amount: -88.9, date: '2026-07-12', category: 'Food' },
      { description: 'IFOOD', amount: -19.0, date: '2026-07-20', category: 'Food' },
      { description: 'IFOOD', amount: -64.3, date: '2026-07-28', category: 'Food' },
    ],
  },
  {
    id: 'amazon-unica',
    nome: 'Amazon (compra única)',
    esperado: 'eventual',
    transacoes: [
      { description: 'AMAZON MARKETPLACE', amount: -347.0, date: '2026-06-18', category: 'Shopping' },
    ],
  },
  {
    id: 'prime-avulso',
    nome: 'Prime Video avulso',
    esperado: 'eventual',
    transacoes: [
      { description: 'PRIME VIDEO', amount: -19.9, date: '2026-05-03', category: 'Subscriptions' },
    ],
  },
  {
    id: 'pix-pessoa',
    nome: 'PIX para pessoa',
    esperado: 'eventual',
    transacoes: [
      { description: 'PIX TRANSF MARIA SILVA', amount: -200, date: '2026-05-10', category: 'Transfer' },
      { description: 'PIX TRANSF MARIA SILVA', amount: -200, date: '2026-06-10', category: 'Transfer' },
      { description: 'PIX TRANSF MARIA SILVA', amount: -200, date: '2026-07-10', category: 'Transfer' },
    ],
  },
  {
    id: 'parcela',
    nome: 'Parcela de loja',
    esperado: 'eventual',
    transacoes: [
      {
        description: 'SOLAR MOVEIS E ELETROS 10/12',
        amount: 149.9,
        date: '2026-02-27',
        category: 'Shopping',
        tipoConta: 'CREDIT',
      },
      {
        description: 'SOLAR MOVEIS E ELETROS 11/12',
        amount: 149.9,
        date: '2026-03-27',
        category: 'Shopping',
        tipoConta: 'CREDIT',
      },
      {
        description: 'SOLAR MOVEIS E ELETROS 12/12',
        amount: 149.9,
        date: '2026-04-27',
        category: 'Shopping',
        tipoConta: 'CREDIT',
      },
    ],
  },
  {
    id: 'fatura',
    nome: 'Pagamento de fatura',
    esperado: 'eventual',
    transacoes: [
      { description: 'PAGAMENTO FATURA CARTAO VISA', amount: -167.7, date: '2026-05-31', category: 'Loan' },
      { description: 'PAGAMENTO FATURA CARTAO VISA', amount: -167.7, date: '2026-06-30', category: 'Loan' },
      { description: 'PAGAMENTO FATURA CARTAO VISA', amount: -167.7, date: '2026-07-31', category: 'Loan' },
    ],
  },
];

export function extratoDemo(casos = CASOS_DEMO): TransacaoAnalise[] {
  return casos.flatMap((caso) => caso.transacoes);
}

export function resumoDatasetDemo(casos = CASOS_DEMO) {
  const transacoes = extratoDemo(casos);
  const recorrentes = casos.filter((c) => c.esperado === 'recorrente').length;
  const naoRecorrentes = casos.filter((c) => c.esperado === 'eventual').length;

  return {
    totalTransacoes: transacoes.length,
    totalCasos: casos.length,
    recorrentesEsperados: recorrentes,
    naoRecorrentesEsperados: naoRecorrentes,
    aviso:
      'Dados fictícios e determinísticos para demonstração acadêmica. Não representam sincronização bancária real.',
  };
}
