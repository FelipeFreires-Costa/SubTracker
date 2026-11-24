import {
  chaveDescricao,
  classificarPeriodicidadePorDatas,
  ehParcelaCartao,
  ehRuidoBancario,
  ehTransferenciaPessoa,
  identificarRecorrencias,
  toleranciaDeValor,
  valoresProximos,
  type Classificacao,
  type Periodicidade,
  type RecorrenciaDetectada,
  type TransacaoAnalise,
} from '../utils/heuristica.recorrencia';
import { CASOS_DEMO, extratoDemo, resumoDatasetDemo, type CasoDemo } from './dataset.demo';

function parseData(valor: string): Date {
  return new Date(`${valor.split('T')[0]}T00:00:00`);
}

function intervalosEmDias(datas: Date[]): number[] {
  const ordenadas = [...datas].sort((a, b) => a.getTime() - b.getTime());
  const gaps: number[] = [];
  for (let i = 1; i < ordenadas.length; i += 1) {
    const atual = ordenadas[i];
    const anterior = ordenadas[i - 1];
    if (!atual || !anterior) continue;
    gaps.push(Math.round((atual.getTime() - anterior.getTime()) / (1000 * 60 * 60 * 24)));
  }
  return gaps;
}

function rotuloClassificacao(valor: Classificacao): string {
  return valor === 'recorrente' ? 'Recorrente' : 'Não recorrente';
}

function rotuloPeriodicidade(valor?: Periodicidade | null): string | null {
  if (!valor || valor === 'indefinida') return null;
  if (valor === 'mensal') return 'Mensal';
  if (valor === 'bimestral') return 'Bimestral';
  if (valor === 'anual') return 'Anual';
  return valor;
}

function criteriosAplicados(caso: CasoDemo, detectada?: RecorrenciaDetectada) {
  const amostra = caso.transacoes[0];
  const chave = chaveDescricao(amostra?.description ?? caso.nome);
  const filtradoRuido = ehRuidoBancario(chave);
  const filtradoPix = caso.transacoes.some((t) =>
    ehTransferenciaPessoa(t.description, t.category),
  );
  const filtradoParcela = caso.transacoes.some((t) => ehParcelaCartao(t.description, t));
  const datas = caso.transacoes.map((t) => parseData(t.date));
  const gaps = intervalosEmDias(datas);
  const valores = caso.transacoes.map((t) => t.amount);
  const categoria = caso.transacoes.find((t) => t.category)?.category ?? '';
  const tolerancia = toleranciaDeValor(categoria);
  const valoresOk = valoresProximos(valores, tolerancia);
  const periodicidade = classificarPeriodicidadePorDatas(datas);
  const assinatura = caso.transacoes.some(
    (t) => t.category?.toLowerCase() === 'subscriptions',
  );

  return {
    chave,
    filtradoRuido,
    filtradoPix,
    filtradoParcela,
    ocorrencias: caso.transacoes.length,
    intervalosDias: gaps,
    valores: valores.map((v) => Math.abs(v)),
    toleranciaValor: tolerancia,
    valoresEstaveis: valoresOk,
    periodicidadeDetectada: periodicidade,
    periodicidadeRotulo: rotuloPeriodicidade(periodicidade),
    categoriaAssinatura: assinatura,
    classificacaoObtida: detectada?.classificacao ?? 'eventual',
    periodicidadeObtida: detectada?.periodicidade ?? periodicidade,
  };
}

function explicarCaso(
  caso: CasoDemo,
  criterios: ReturnType<typeof criteriosAplicados>,
): string {
  if (criterios.filtradoRuido) {
    return 'Não foi considerada recorrente porque a descrição corresponde a pagamento de fatura/boleto, filtrado antes da análise de padrão.';
  }

  if (criterios.filtradoPix) {
    return 'Não foi considerada recorrente porque as transações foram identificadas como transferência a pessoa (PIX/TED), sem indicador de compromisso periódico.';
  }

  if (criterios.filtradoParcela) {
    return 'Não foi considerada recorrente porque as ocorrências seguem padrão de parcelamento (metadado ou texto no formato N/M), excluído pelos filtros do algoritmo.';
  }

  if (criterios.classificacaoObtida === 'recorrente') {
    const ciclo = criterios.periodicidadeRotulo ?? 'reconhecida';
    const atalho =
      criterios.ocorrencias === 2 && criterios.categoriaAssinatura
        ? ' Com duas ocorrências, a categoria Subscriptions permitiu a identificação.'
        : criterios.ocorrencias === 2 && criterios.periodicidadeDetectada === 'anual'
          ? ' Com duas ocorrências e ciclo anual, o critério mínimo foi atendido.'
          : '';
    return (
      `Esta despesa foi identificada como recorrente porque apresenta ${criterios.ocorrencias} ocorrências ` +
      `com intervalos compatíveis com periodicidade ${ciclo.toLowerCase()}, valores dentro da tolerância ` +
      `aplicada (${(criterios.toleranciaValor * 100).toFixed(0)}%) e sem filtros de exclusão.` +
      atalho
    );
  }

  if (criterios.ocorrencias < 2) {
    return 'Não foram encontrados elementos suficientes para caracterizar um padrão de recorrência: há menos de duas ocorrências comparáveis.';
  }

  if (!criterios.valoresEstaveis) {
    return (
      'Não foi identificada como recorrente porque a variação dos valores ultrapassa a tolerância ' +
      `aplicada à categoria (${(criterios.toleranciaValor * 100).toFixed(0)}%), mesmo com ocorrências repetidas.`
    );
  }

  if (criterios.periodicidadeDetectada === 'indefinida') {
    return 'Não foi identificada como recorrente porque os intervalos entre datas não se enquadram nas faixas mensal (25–36 dias), bimestral (55–75) ou anual (340–390).';
  }

  if (criterios.ocorrencias === 2 && !criterios.categoriaAssinatura && criterios.periodicidadeDetectada !== 'anual') {
    return 'Não foi identificada como recorrente: com apenas duas ocorrências, o algoritmo exige ciclo anual ou categoria Subscriptions.';
  }

  return 'Não foram encontrados elementos suficientes para caracterizar um padrão de recorrência segundo os critérios do algoritmo.';
}

export function obterDatasetDemo() {
  const resumo = resumoDatasetDemo();
  return {
    ...resumo,
    casos: CASOS_DEMO.map((caso) => ({
      id: caso.id,
      nome: caso.nome,
      esperado: caso.esperado,
      esperadoRotulo: rotuloClassificacao(caso.esperado),
      periodicidadeEsperada: caso.periodicidadeEsperada ?? null,
      periodicidadeEsperadaRotulo: rotuloPeriodicidade(caso.periodicidadeEsperada),
      ocorrencias: caso.transacoes.length,
      transacoes: caso.transacoes.map((t) => ({
        descricao: t.description,
        valor: t.amount,
        data: t.date,
        categoria: t.category,
        tipoConta: t.tipoConta ?? null,
      })),
    })),
  };
}

export function executarDemo() {
  const inicio = process.hrtime.bigint();
  const extrato = extratoDemo();
  const detectadas = identificarRecorrencias(extrato, '2026-07-31');
  const fim = process.hrtime.bigint();
  const tempoMs = Number(fim - inicio) / 1_000_000;

  const porChave = new Map(detectadas.map((d) => [d.chave, d]));

  const casos = CASOS_DEMO.map((caso) => {
    const amostra = caso.transacoes[0];
    const chave = chaveDescricao(amostra?.description ?? caso.nome);
    const detectada = porChave.get(chave);
    const criterios = criteriosAplicados(caso, detectada);
    const obtido = (detectada?.classificacao ?? 'eventual') as Classificacao;

    return {
      id: caso.id,
      nome: caso.nome,
      chave,
      esperado: caso.esperado,
      esperadoRotulo: rotuloClassificacao(caso.esperado),
      obtido,
      obtidoRotulo: rotuloClassificacao(obtido),
      periodicidadeEsperada: caso.periodicidadeEsperada ?? null,
      periodicidadeObtida: detectada?.periodicidade ?? criterios.periodicidadeDetectada,
      periodicidadeObtidaRotulo: rotuloPeriodicidade(
        detectada?.periodicidade ?? criterios.periodicidadeDetectada,
      ),
      ocorrencias: caso.transacoes.length,
      categoria: amostra?.category ?? null,
      valores: criterios.valores,
      intervalosDias: criterios.intervalosDias,
      toleranciaValor: criterios.toleranciaValor,
      valoresEstaveis: criterios.valoresEstaveis,
      filtros: {
        ruidoBancario: criterios.filtradoRuido,
        transferenciaPessoa: criterios.filtradoPix,
        parcelamento: criterios.filtradoParcela,
      },
      explicacao: explicarCaso(caso, criterios),
      transacoes: caso.transacoes.map((t) => ({
        descricao: t.description,
        valor: t.amount,
        data: t.date,
        categoria: t.category,
        tipoConta: t.tipoConta ?? null,
      })),
    };
  });

  const recorrentes = casos.filter((c) => c.obtido === 'recorrente').length;
  const naoRecorrentes = casos.length - recorrentes;

  return {
    aviso:
      'Execução em memória com identificarRecorrencias (algoritmo real). Nenhum dado foi gravado no banco nem sincronizado com a Pluggy.',
    resumo: {
      transacoesAnalisadas: extrato.length,
      casosAnalisados: casos.length,
      recorrentesIdentificados: recorrentes,
      naoRecorrentesIdentificados: naoRecorrentes,
      tempoMs: Number(tempoMs.toFixed(2)),
    },
    casos,
  };
}

export type ResultadoDemo = ReturnType<typeof executarDemo>;
