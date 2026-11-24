import { apiRequest } from './apiClient';

export interface TransacaoDemo {
  descricao: string;
  valor: number;
  data: string;
  categoria: string;
  tipoConta: string | null;
}

export interface CasoDemoResumo {
  id: string;
  nome: string;
  esperado: 'recorrente' | 'eventual';
  esperadoRotulo: string;
  periodicidadeEsperada: string | null;
  periodicidadeEsperadaRotulo: string | null;
  ocorrencias: number;
  transacoes: TransacaoDemo[];
}

export interface DatasetDemo {
  totalTransacoes: number;
  totalCasos: number;
  recorrentesEsperados: number;
  naoRecorrentesEsperados: number;
  aviso: string;
  casos: CasoDemoResumo[];
}

export interface CasoDemoResultado extends CasoDemoResumo {
  chave: string;
  obtido: 'recorrente' | 'eventual';
  obtidoRotulo: string;
  periodicidadeObtida: string | null;
  periodicidadeObtidaRotulo: string | null;
  categoria: string | null;
  valores: number[];
  intervalosDias: number[];
  toleranciaValor: number;
  valoresEstaveis: boolean;
  filtros: {
    ruidoBancario: boolean;
    transferenciaPessoa: boolean;
    parcelamento: boolean;
  };
  explicacao: string;
}

export interface ResultadoDemo {
  aviso: string;
  resumo: {
    transacoesAnalisadas: number;
    casosAnalisados: number;
    recorrentesIdentificados: number;
    naoRecorrentesIdentificados: number;
    tempoMs: number;
  };
  casos: CasoDemoResultado[];
}

export interface MetricasDemo {
  avisoGeral: string;
  divergenciasPromptIgnoradas: string[];
  experimental: {
    identificacao: string;
    papel: string;
    semente: number;
    perfis: number;
    mesesPorPerfil: number;
    totalCasos: number;
    totalTransacoes: number;
    recorrentes: number;
    naoRecorrentes: number;
    heuristica: {
      verdadeirosPositivos: number;
      verdadeirosNegativos: number;
      falsosPositivos: number;
      falsosNegativos: number;
      acuracia: number;
      precisao: number;
      recall: number;
      f1: number;
      acertoDeCicloEntreRecorrentes: number;
    };
    linhaDeBase: {
      nome: string;
      acuracia: number;
      precisao: number;
      recall: number;
      f1: number;
      verdadeirosPositivos: number;
      verdadeirosNegativos: number;
      falsosPositivos: number;
      falsosNegativos: number;
    };
    matrizConfusao: {
      realRecorrentePreditoRecorrente: number;
      realRecorrentePreditoNao: number;
      realNaoPreditoRecorrente: number;
      realNaoPreditoNao: number;
    };
    observacao: string;
  };
  desenvolvimento: {
    identificacao: string;
    papel: string;
    totalCasos: number;
    totalTransacoes: number;
    ruidoForaAvaliacao: number;
    recorrentes: number;
    naoRecorrentes: number;
    acuracia: number;
    precisao: number;
    recall: number;
    f1: number;
    verdadeirosPositivos: number;
    verdadeirosNegativos: number;
    falsosPositivos: number;
    falsosNegativos: number;
    observacao: string;
  };
  estabilidade: {
    nSementes: number;
    nPorSemente: number;
    totalCasos: number;
    meanAcc: number | null;
    minAcc: number | null;
    maxAcc: number | null;
    meanF1: number | null;
    totalFP: number | null;
    totalFN: number | null;
  } | null;
  criterios: {
    toleranciaPadrao: number;
    toleranciaConsumo: number;
    folgaAbsolutaReais: number;
    intervaloMensalDias: [number, number];
    intervaloBimestralDias: [number, number];
    intervaloAnualDias: [number, number];
    ocorrenciasMinimas: number;
    ocorrenciasComAtalho: number;
    atalhoAnualOuSubscriptions: boolean;
    fonte: string;
  };
  avaliacaoReal: {
    disponivelNoRepositorio: boolean;
    observacao: string;
  };
}

export const demoAcademicaService = {
  dataset: () => apiRequest<DatasetDemo>('/demo-academica/dataset'),
  executar: () =>
    apiRequest<ResultadoDemo>('/demo-academica/executar', { method: 'POST' }),
  metricas: () => apiRequest<MetricasDemo>('/demo-academica/metricas'),
};
