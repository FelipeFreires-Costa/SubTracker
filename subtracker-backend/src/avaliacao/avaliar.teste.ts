import type { Classificacao, Periodicidade } from '../utils/heuristica.recorrencia';
import { chaveDescricao, identificarRecorrencias } from '../utils/heuristica.recorrencia';
import { classificarPorRepeticao, resumir, vereditoDe, type ResumoAvaliacao, type Veredito } from './avaliar.heuristica';
import {
  MESES_NO_PERIODO,
  PERFIS_TESTE,
  SEMENTE_TESTE,
  gerarConjuntoTeste,
  type Cenario,
} from './dataset.teste';

export interface LinhaTeste {
  perfil: string;
  nome: string;
  cenario: Cenario;
  transacoes: number;
  esperado: Classificacao;
  obtido: Classificacao;
  veredito: Veredito;
  obtidoLinhaDeBase: Classificacao;
  vereditoLinhaDeBase: Veredito;
  periodicidadeEsperada?: Periodicidade;
  periodicidadeObtida?: Periodicidade;
  cicloCorreto: boolean | null;
}

export interface RelatorioTeste {
  geradoEm: string;
  semente: number;
  perfis: number;
  mesesPorPerfil: number;
  totalCasos: number;
  totalTransacoes: number;
  heuristica: ResumoAvaliacao;
  linhaDeBase: ResumoAvaliacao;
  acertoDeCicloEntreRecorrentes: number | null;
  porCenario: Array<{ cenario: Cenario; casos: number; heuristica: ResumoAvaliacao; linhaDeBase: ResumoAvaliacao }>;
  linhas: LinhaTeste[];
  observacao: string;
}

/**
 * Unidade de avaliação: o caso (grupo de transações de um mesmo credor dentro de um perfil).
 * O caso conta como "recorrente" se algum grupo formado a partir das suas transações
 * foi classificado como recorrente; caso contrário, "eventual".
 */
export function avaliarConjuntoTeste(semente = SEMENTE_TESTE, quantidade = PERFIS_TESTE): RelatorioTeste {
  const perfis = gerarConjuntoTeste(semente, quantidade);
  const linhas: LinhaTeste[] = [];

  for (const perfil of perfis) {
    const extrato = [...perfil.casos.flatMap((caso) => caso.transacoes), ...perfil.ruido];
    const detectadas = identificarRecorrencias(extrato);

    for (const caso of perfil.casos) {
      const chaves = new Set(caso.transacoes.map((t) => chaveDescricao(t.description)));
      const grupos = detectadas.filter((grupo) => chaves.has(grupo.chave));
      const recorrentes = grupos
        .filter((grupo) => grupo.classificacao === 'recorrente')
        .sort((a, b) => b.ocorrencias - a.ocorrencias);
      const obtido: Classificacao = recorrentes.length > 0 ? 'recorrente' : 'eventual';
      const periodicidadeObtida = recorrentes[0]?.periodicidade;

      const obtidoLinhaDeBase: Classificacao = [...chaves].some(
        (chave) => classificarPorRepeticao(caso.transacoes, chave) === 'recorrente',
      )
        ? 'recorrente'
        : 'eventual';

      linhas.push({
        perfil: perfil.nome,
        nome: caso.nome,
        cenario: caso.cenario,
        transacoes: caso.transacoes.length,
        esperado: caso.esperado,
        obtido,
        veredito: vereditoDe(caso.esperado, obtido),
        obtidoLinhaDeBase,
        vereditoLinhaDeBase: vereditoDe(caso.esperado, obtidoLinhaDeBase),
        periodicidadeEsperada: caso.periodicidadeEsperada,
        periodicidadeObtida,
        cicloCorreto:
          caso.esperado === 'recorrente' && obtido === 'recorrente' && caso.periodicidadeEsperada
            ? periodicidadeObtida === caso.periodicidadeEsperada
            : null,
      });
    }
  }

  const cenarios = [...new Set(linhas.map((linha) => linha.cenario))].sort();
  const porCenario = cenarios.map((cenario) => {
    const doCenario = linhas.filter((linha) => linha.cenario === cenario);
    return {
      cenario,
      casos: doCenario.length,
      heuristica: resumir(doCenario),
      linhaDeBase: resumir(doCenario.map((linha) => ({ veredito: linha.vereditoLinhaDeBase }))),
    };
  });

  const ciclos = linhas.filter((linha) => linha.cicloCorreto !== null);
  const ciclosOk = ciclos.filter((linha) => linha.cicloCorreto).length;

  return {
    geradoEm: new Date().toISOString(),
    semente,
    perfis: perfis.length,
    mesesPorPerfil: MESES_NO_PERIODO,
    totalCasos: linhas.length,
    totalTransacoes: perfis.reduce(
      (total, perfil) => total + perfil.casos.reduce((soma, caso) => soma + caso.transacoes.length, 0),
      0,
    ),
    heuristica: resumir(linhas),
    linhaDeBase: resumir(linhas.map((linha) => ({ veredito: linha.vereditoLinhaDeBase }))),
    acertoDeCicloEntreRecorrentes:
      ciclos.length === 0 ? null : Number(((ciclosOk / ciclos.length) * 100).toFixed(1)),
    porCenario,
    linhas,
    observacao:
      'Conjunto de teste sintético, separado do gabarito de desenvolvimento, gerado por semente fixa. O rótulo vem do tipo de cenário, não da saída do algoritmo. As métricas medem acordo com este conjunto, não acurácia em extratos reais.',
  };
}
