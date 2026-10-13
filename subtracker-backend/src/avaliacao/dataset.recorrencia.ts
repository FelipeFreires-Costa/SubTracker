import type { Classificacao, Periodicidade, TransacaoAnalise } from '../utils/heuristica.recorrencia';
import { chaveDescricao } from '../utils/heuristica.recorrencia';

export interface CasoGabarito {
  nome: string;
  esperado: Classificacao;
  periodicidadeEsperada?: Periodicidade;
  transacoes: TransacaoAnalise[];
}

export function chaveDoCaso(caso: CasoGabarito): string {
  const amostra = caso.transacoes[0]?.description ?? caso.nome;
  return chaveDescricao(amostra);
}

/**
 * Extrato sintético rotulado (sem dados pessoais).
 * Cobre assinaturas reais, armadilhas de palavra-chave e gastos eventuais.
 */
export const GABARITO_RECORRENCIA: CasoGabarito[] = [
  {
    nome: 'Netflix',
    esperado: 'recorrente',
    periodicidadeEsperada: 'mensal',
    transacoes: [
      { description: 'NETFLIX.COM', amount: -55.9, date: '2026-04-10', category: 'Subscriptions' },
      { description: 'Netflix', amount: -55.9, date: '2026-05-10', category: 'Subscriptions' },
      { description: 'NETFLIX', amount: -27.95, date: '2026-06-10', category: 'Subscriptions' },
      { description: 'NETFLIX', amount: -55.9, date: '2026-07-10', category: 'Subscriptions' },
    ],
  },
  {
    nome: 'Spotify (cartão)',
    esperado: 'recorrente',
    periodicidadeEsperada: 'mensal',
    transacoes: [
      { description: 'SPOTIFY', amount: 21.9, date: '2026-05-05', category: 'Subscriptions', tipoConta: 'CREDIT' },
      { description: 'SPOTIFY', amount: 21.9, date: '2026-06-05', category: 'Subscriptions', tipoConta: 'CREDIT' },
      { description: 'SPOTIFY', amount: 21.9, date: '2026-08-05', category: 'Subscriptions', tipoConta: 'CREDIT' },
    ],
  },
  {
    nome: 'Adobe',
    esperado: 'recorrente',
    periodicidadeEsperada: 'mensal',
    transacoes: [
      { description: 'ADOBE SYSTEMS', amount: -89, date: '2026-05-02', category: 'Subscriptions' },
      { description: 'ADOBE SYSTEMS', amount: -89, date: '2026-06-02', category: 'Subscriptions' },
      { description: 'ADOBE SYSTEMS', amount: -89, date: '2026-07-02', category: 'Subscriptions' },
    ],
  },
  {
    nome: 'Internet Vivo',
    esperado: 'recorrente',
    periodicidadeEsperada: 'mensal',
    transacoes: [
      { description: 'VIVO FIBRA', amount: -99.99, date: '2026-04-15', category: 'Utilities' },
      { description: 'VIVO FIBRA', amount: -99.99, date: '2026-05-15', category: 'Utilities' },
      { description: 'VIVO FIBRA', amount: -99.99, date: '2026-06-15', category: 'Utilities' },
      { description: 'VIVO FIBRA', amount: -99.99, date: '2026-07-15', category: 'Utilities' },
    ],
  },
  {
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
    nome: 'Seguro auto',
    esperado: 'recorrente',
    periodicidadeEsperada: 'anual',
    transacoes: [
      { description: 'PORTO SEGURO AUTO', amount: -1240, date: '2025-03-01', category: 'Insurance' },
      { description: 'PORTO SEGURO AUTO', amount: -1240, date: '2026-03-01', category: 'Insurance' },
    ],
  },
  {
    nome: 'Claro TV (fim do mês)',
    esperado: 'recorrente',
    periodicidadeEsperada: 'mensal',
    transacoes: [
      { description: 'CLARO TV', amount: -89.9, date: '2026-01-31', category: 'Utilities' },
      { description: 'CLARO TV', amount: -89.9, date: '2026-02-28', category: 'Utilities' },
      { description: 'CLARO TV', amount: -89.9, date: '2026-03-31', category: 'Utilities' },
    ],
  },
  {
    nome: 'Amazon Prime (extrato)',
    esperado: 'recorrente',
    periodicidadeEsperada: 'mensal',
    transacoes: [
      {
        description: 'AMAZONPRIMEBR*8831',
        merchantName: 'Amazon Prime',
        amount: -14.9,
        date: '2026-05-10',
        category: 'Subscriptions',
      },
      {
        description: 'AMAZONPRIMEBR*9920',
        merchantName: 'Amazon Prime',
        amount: -14.9,
        date: '2026-06-10',
        category: 'Subscriptions',
      },
      {
        description: 'AMAZONPRIMEBR',
        merchantName: 'Amazon Prime',
        amount: -14.9,
        date: '2026-07-10',
        category: 'Subscriptions',
      },
    ],
  },
  {
    nome: 'YouTube Premium',
    esperado: 'recorrente',
    periodicidadeEsperada: 'mensal',
    transacoes: [
      { description: 'YOUTUBEPREMIUM', amount: -24.9, date: '2026-05-12', category: 'Subscriptions' },
      { description: 'Youtube Premium', amount: -24.9, date: '2026-06-12', category: 'Subscriptions' },
      { description: 'YOUTUBEPREMIUM 118', amount: -24.9, date: '2026-07-12', category: 'Subscriptions' },
    ],
  },
  {
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
    nome: 'Uber',
    esperado: 'eventual',
    transacoes: [
      { description: 'UBER TRIP', amount: -14.2, date: '2026-07-03', category: 'Transport' },
      { description: 'UBER TRIP', amount: -27.8, date: '2026-07-08', category: 'Transport' },
      { description: 'UBER TRIP', amount: -9.5, date: '2026-07-14', category: 'Transport' },
      { description: 'UBER TRIP', amount: -41.0, date: '2026-07-22', category: 'Transport' },
    ],
  },
  {
    nome: 'Supermercado',
    esperado: 'eventual',
    transacoes: [
      { description: 'SUPERMERCADO EXTRA', amount: -86.4, date: '2026-07-05', category: 'Groceries' },
      { description: 'SUPERMERCADO EXTRA', amount: -210.15, date: '2026-07-12', category: 'Groceries' },
      { description: 'SUPERMERCADO EXTRA', amount: -54.9, date: '2026-07-19', category: 'Groceries' },
    ],
  },
  {
    nome: 'Amazon compra única',
    esperado: 'eventual',
    transacoes: [
      { description: 'AMAZON MARKETPLACE', amount: -347.0, date: '2026-06-18', category: 'Shopping' },
    ],
  },
  {
    nome: 'Prime Video avulso',
    esperado: 'eventual',
    transacoes: [
      { description: 'PRIME VIDEO', amount: -19.9, date: '2026-05-03', category: 'Subscriptions' },
    ],
  },
  {
    nome: 'PIX único',
    esperado: 'eventual',
    transacoes: [
      { description: 'PIX TRANSF TERCEIRO', amount: -150, date: '2026-07-09', category: 'Transfer' },
    ],
  },
  {
    nome: 'PIX mensal para pessoa',
    esperado: 'eventual',
    transacoes: [
      { description: 'PIX TRANSF MARIA SILVA', amount: -200, date: '2026-05-10', category: 'Transfer' },
      { description: 'PIX TRANSF MARIA SILVA', amount: -200, date: '2026-06-10', category: 'Transfer' },
      { description: 'PIX TRANSF MARIA SILVA', amount: -200, date: '2026-07-10', category: 'Transfer' },
    ],
  },
  {
    nome: 'TED periódico',
    esperado: 'eventual',
    transacoes: [
      { description: 'TED 001234', amount: -500, date: '2026-05-01', category: 'Transfer' },
      { description: 'TED 001234', amount: -500, date: '2026-06-01', category: 'Transfer' },
      { description: 'TED 001234', amount: -500, date: '2026-07-01', category: 'Transfer' },
    ],
  },
  {
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
    nome: 'Padaria',
    esperado: 'eventual',
    transacoes: [
      { description: 'PADARIA CENTRAL', amount: -12.5, date: '2026-07-04', category: 'Food' },
      { description: 'PADARIA CENTRAL', amount: -28.9, date: '2026-07-19', category: 'Food' },
    ],
  },
  {
    nome: 'Parcela de loja',
    esperado: 'eventual',
    transacoes: [
      { description: 'SOLAR MOVEIS E ELETROS 10/12', amount: 149.9, date: '2026-02-27', category: 'Shopping', tipoConta: 'CREDIT' },
      { description: 'SOLAR MOVEIS E ELETROS 11/12', amount: 149.9, date: '2026-03-27', category: 'Shopping', tipoConta: 'CREDIT' },
      { description: 'SOLAR MOVEIS E ELETROS 12/12', amount: 149.9, date: '2026-04-27', category: 'Shopping', tipoConta: 'CREDIT' },
    ],
  },
  {
    nome: 'Fatura do cartão',
    esperado: 'eventual',
    transacoes: [
      { description: 'PAGAMENTO FATURA CARTAO VISA', amount: -167.7, date: '2026-05-31', category: 'Loan' },
      { description: 'PAGAMENTO FATURA CARTAO VISA', amount: -167.7, date: '2026-06-30', category: 'Loan' },
      { description: 'PAGAMENTO FATURA CARTAO VISA', amount: -167.7, date: '2026-07-31', category: 'Loan' },
    ],
  },
];

export function extratoDoGabarito(casos = GABARITO_RECORRENCIA): TransacaoAnalise[] {
  const transacoes: TransacaoAnalise[] = [];

  for (const caso of casos) {
    transacoes.push(...caso.transacoes);
  }

  transacoes.push(
    { description: 'SALARIO EMPRESA X', amount: 4200, date: '2026-07-05', category: 'Income' },
    { description: 'PAGAMENTO FATURA', amount: -800, date: '2026-07-10', category: 'Loan', tipoConta: 'CREDIT' },
  );

  return transacoes;
}
