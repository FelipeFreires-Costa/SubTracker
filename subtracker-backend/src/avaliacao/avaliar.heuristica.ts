import type { Classificacao, Periodicidade, TransacaoAnalise } from '../utils/heuristica.recorrencia';
import { chaveDescricao, identificarRecorrencias } from '../utils/heuristica.recorrencia';
import {
  GABARITO_RECORRENCIA,
  chaveDoCaso,
  extratoDoGabarito,
  type CasoGabarito,
} from './dataset.recorrencia';

export type Veredito = 'VP' | 'VN' | 'FP' | 'FN';

export interface LinhaAvaliacao {
  nome: string;
  esperado: Classificacao;
  obtido: Classificacao;
  veredito: Veredito;
  periodicidadeEsperada?: Periodicidade;
  periodicidadeObtida?: Periodicidade;
  cicloCorreto: boolean | null;
  ocorrencias: number;
}

export interface ResumoAvaliacao {
  verdadeirosPositivos: number;
  verdadeirosNegativos: number;
  falsosPositivos: number;
  falsosNegativos: number;
  acuracia: number;
  precisao: number;
  recall: number;
  f1: number;
}

export interface RelatorioAvaliacao {
  geradoEm: string;
  totalCasos: number;
  verdadeirosPositivos: number;
  verdadeirosNegativos: number;
  falsosPositivos: number;
  falsosNegativos: number;
  acuracia: number;
  precisao: number;
  recall: number;
  f1: number;
  acertoDeCicloEntreRecorrentes: number | null;
  linhas: LinhaAvaliacao[];
  observacao: string;
  linhaDeBase: ResumoAvaliacao & {
    nome: string;
    casosCorrigidos: string[];
  };
}

export function vereditoDe(esperado: Classificacao, obtido: Classificacao): Veredito {
  if (esperado === 'recorrente' && obtido === 'recorrente') return 'VP';
  if (esperado === 'eventual' && obtido === 'eventual') return 'VN';
  if (esperado === 'eventual' && obtido === 'recorrente') return 'FP';
  return 'FN';
}

function percentual(parte: number, todo: number): number {
  if (todo === 0) return 0;
  return Number(((parte / todo) * 100).toFixed(1));
}

export function resumir(linhas: Array<{ veredito: Veredito }>): ResumoAvaliacao {
  const vp = linhas.filter((linha) => linha.veredito === 'VP').length;
  const vn = linhas.filter((linha) => linha.veredito === 'VN').length;
  const fp = linhas.filter((linha) => linha.veredito === 'FP').length;
  const fn = linhas.filter((linha) => linha.veredito === 'FN').length;
  const precisao = vp + fp === 0 ? 0 : vp / (vp + fp);
  const recall = vp + fn === 0 ? 0 : vp / (vp + fn);
  const f1 = precisao + recall === 0 ? 0 : (2 * precisao * recall) / (precisao + recall);

  return {
    verdadeirosPositivos: vp,
    verdadeirosNegativos: vn,
    falsosPositivos: fp,
    falsosNegativos: fn,
    acuracia: percentual(vp + vn, linhas.length),
    precisao: Number((precisao * 100).toFixed(1)),
    recall: Number((recall * 100).toFixed(1)),
    f1: Number((f1 * 100).toFixed(1)),
  };
}

/** Repetiu a descrição ≥ 2 vezes = recorrente. Sem filtro de PIX, valor nem ciclo. */
export function classificarPorRepeticao(
  transacoes: TransacaoAnalise[],
  chave: string,
): Classificacao {
  const ocorrencias = transacoes.filter((item) => chaveDescricao(item.description) === chave).length;
  return ocorrencias >= 2 ? 'recorrente' : 'eventual';
}

export function avaliarHeuristica(casos: CasoGabarito[] = GABARITO_RECORRENCIA): RelatorioAvaliacao {
  const detectadas = identificarRecorrencias(extratoDoGabarito(casos));
  const porChave = new Map(detectadas.map((item) => [item.chave, item]));

  const linhas: LinhaAvaliacao[] = casos.map((caso) => {
    const obtido = porChave.get(chaveDoCaso(caso));
    const classificacaoObtida: Classificacao = obtido?.classificacao ?? 'eventual';
    const cicloCorreto =
      caso.esperado === 'recorrente' && caso.periodicidadeEsperada
        ? obtido?.periodicidade === caso.periodicidadeEsperada
        : null;

    return {
      nome: caso.nome,
      esperado: caso.esperado,
      obtido: classificacaoObtida,
      veredito: vereditoDe(caso.esperado, classificacaoObtida),
      periodicidadeEsperada: caso.periodicidadeEsperada,
      periodicidadeObtida: obtido?.periodicidade,
      cicloCorreto,
      ocorrencias: obtido?.ocorrencias ?? caso.transacoes.length,
    };
  });

  const heuristica = resumir(linhas);
  const linhasBase = casos.map((caso) => {
    const obtido = classificarPorRepeticao(caso.transacoes, chaveDoCaso(caso));
    return {
      nome: caso.nome,
      esperado: caso.esperado,
      obtido,
      veredito: vereditoDe(caso.esperado, obtido),
    };
  });
  const linhaDeBase = resumir(linhasBase);
  const casosCorrigidos = linhas
    .filter((linha, indice) => {
      const base = linhasBase[indice];
      return base !== undefined && base.veredito !== 'VP' && base.veredito !== 'VN' && (linha.veredito === 'VP' || linha.veredito === 'VN');
    })
    .map((linha) => linha.nome);

  const ciclos = linhas.filter((linha) => linha.cicloCorreto !== null);
  const ciclosOk = ciclos.filter((linha) => linha.cicloCorreto).length;

  return {
    geradoEm: new Date().toISOString(),
    totalCasos: linhas.length,
    ...heuristica,
    acertoDeCicloEntreRecorrentes: ciclos.length === 0 ? null : percentual(ciclosOk, ciclos.length),
    linhas,
    observacao:
      'Dataset sintético rotulado, sem extrato real nem dado pessoal. As métricas medem o acordo com este gabarito, não a acurácia em contas de usuários. A linha de base marca recorrente só por repetir a descrição; a heurística adiciona valor, ciclo e filtros.',
    linhaDeBase: {
      nome: 'Repetição da descrição (≥ 2 vezes), sem valor, ciclo nem filtro de PIX',
      ...linhaDeBase,
      casosCorrigidos,
    },
  };
}
