export type Periodicidade = 'mensal' | 'bimestral' | 'anual' | 'indefinida';
export type OrigemConta = 'manual' | 'pluggy';
export type SituacaoConta = 'ativa' | 'pendente' | 'encerrada';

export interface Conta {
  id: number;
  nome: string;
  preco: number;
  data: string;
  pago: boolean;
  categoria: string;
  recorrente?: boolean;
  periodicidade?: Periodicidade | null;
  proximaCobranca?: string | null;
  origem?: OrigemConta;
  parcelaAtual?: number | null;
  parcelaTotal?: number | null;
  ocorrencias?: number | null;
  primeiraCobranca?: string | null;
  totalGasto?: number | null;
  situacao?: SituacaoConta | null;
}

export interface CriarContaPayload {
  nome: string;
  preco: number;
  data: string;
  pago?: boolean;
  categoria?: string;
  periodicidade?: Periodicidade;
}

export interface AtualizarContaPayload {
  nome: string;
  preco: number;
  data: string;
  categoria?: string;
  periodicidade?: Periodicidade;
}

export interface ImportarPluggyResponse {
  mensagem: string;
  totalAnalisadas?: number;
  totalEncontradas: number;
  totalEncerradas?: number;
  totalEventuais?: number;
  totalImportadas: number;
  totalAtualizadas?: number;
  totalRemovidas?: number;
  totalIgnoradas: number;
  contas: Conta[];
}

export interface ConexaoPluggyStatus {
  conectado: boolean;
  ultimaSincronizacao: string | null;
  transacoesAnalisadas?: number | null;
  recorrentesEncontradas?: number | null;
  eventuaisDescartadas?: number | null;
  exportarExtratoAtivo?: boolean;
}

export interface ConnectTokenResponse {
  accessToken: string;
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

export type VereditoAvaliacao = 'VP' | 'VN' | 'FP' | 'FN';

export interface LinhaAvaliacaoHeuristica {
  nome: string;
  esperado: 'recorrente' | 'eventual';
  obtido: 'recorrente' | 'eventual';
  veredito: VereditoAvaliacao;
  periodicidadeEsperada?: Periodicidade;
  periodicidadeObtida?: Periodicidade;
  cicloCorreto: boolean | null;
  ocorrencias: number;
}

export interface EstabilidadeAvaliacao {
  nSementes: number;
  nPorSemente: number;
  totalCasos: number;
  meanAcc: number | null;
  minAcc: number | null;
  maxAcc: number | null;
  totalFP: number | null;
}

export interface RelatorioAvaliacaoHeuristica {
  papel?: 'teste-independente-oficial' | 'desenvolvimento-regressao';
  semente?: number | null;
  geradoEm: string;
  totalCasos: number;
  totalTransacoes?: number | null;
  perfis?: number;
  mesesPorPerfil?: number;
  verdadeirosPositivos: number;
  verdadeirosNegativos: number;
  falsosPositivos: number;
  falsosNegativos: number;
  acuracia: number;
  precisao: number;
  recall: number;
  f1: number;
  acertoDeCicloEntreRecorrentes: number | null;
  linhas: LinhaAvaliacaoHeuristica[];
  observacao: string;
  estabilidade?: EstabilidadeAvaliacao | null;
  linhaDeBase?: {
    nome: string;
    acuracia: number;
    precisao: number;
    recall: number;
    f1: number;
    verdadeirosPositivos?: number;
    verdadeirosNegativos?: number;
    falsosPositivos: number;
    falsosNegativos: number;
    casosCorrigidos: string[];
  };
}
