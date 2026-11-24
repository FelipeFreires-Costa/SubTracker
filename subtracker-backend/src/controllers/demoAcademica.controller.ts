import fs from 'fs';
import path from 'path';
import type { Request, Response } from 'express';
import { avaliarHeuristica } from '../avaliacao/avaliar.heuristica';
import { avaliarConjuntoTeste } from '../avaliacao/avaliar.teste';
import { executarDemo, obterDatasetDemo } from '../demo-academica/servico.demo';
import { avaliacaoApiAtiva } from '../utils/ambiente';

const SEMENTE_OFICIAL = 2027;

function recusarSeDesligado(res: Response): boolean {
  if (avaliacaoApiAtiva()) return false;
  res.status(404).json({ erro: 'Demonstração acadêmica desativada neste ambiente.' });
  return true;
}

function estabilidade() {
  const arquivo = path.join(
    __dirname,
    '..',
    '..',
    'avaliacao',
    'analise-estabilidade-sementes.json',
  );

  try {
    const bruto = JSON.parse(fs.readFileSync(arquivo, 'utf8')) as {
      nPorSemente?: number;
      resumo?: {
        meanAcc?: number;
        minAcc?: number;
        maxAcc?: number;
        meanF1?: number;
        totalFP?: number;
        totalFN?: number;
        nSementes?: number;
        totalCasos?: number;
      };
    };
    const r = bruto.resumo;
    if (!r) return null;
    return {
      nSementes: r.nSementes ?? 15,
      nPorSemente: bruto.nPorSemente ?? 120,
      totalCasos: r.totalCasos ?? 1800,
      meanAcc: r.meanAcc ?? null,
      minAcc: r.minAcc ?? null,
      maxAcc: r.maxAcc ?? null,
      meanF1: r.meanF1 ?? null,
      totalFP: r.totalFP ?? null,
      totalFN: r.totalFN ?? null,
    };
  } catch {
    return null;
  }
}

function metricasOficiais() {
  const oficial = avaliarConjuntoTeste(SEMENTE_OFICIAL);
  const h = oficial.heuristica;
  const base = oficial.linhaDeBase;
  const dev = avaliarHeuristica();

  return {
    avisoGeral:
      'Métricas lidas da avaliação documentada do TCC. Conjuntos não são misturados. Não medem acurácia em extratos Open Finance reais.',
    divergenciasPromptIgnoradas: [
      'O valor 76,7% (semente 2026 pré-congelamento) não é evidência oficial — foi marcado como exploração contaminada na documentação.',
      'A avaliação “9 casos / 88,9%” do prompt não possui arquivo versionado no repositório (pipeline avaliacao-real é local e gitignored).',
      'Transações do held-out oficial: 958 (não 938).',
    ],
    experimental: {
      identificacao: 'Avaliação experimental (held-out, semente 2027)',
      papel: 'evidencia-formal',
      semente: SEMENTE_OFICIAL,
      perfis: oficial.perfis,
      mesesPorPerfil: oficial.mesesPorPerfil,
      totalCasos: oficial.totalCasos,
      totalTransacoes: oficial.totalTransacoes,
      recorrentes: 60,
      naoRecorrentes: 60,
      heuristica: {
        verdadeirosPositivos: h.verdadeirosPositivos,
        verdadeirosNegativos: h.verdadeirosNegativos,
        falsosPositivos: h.falsosPositivos,
        falsosNegativos: h.falsosNegativos,
        acuracia: h.acuracia,
        precisao: h.precisao,
        recall: h.recall,
        f1: h.f1,
        acertoDeCicloEntreRecorrentes: oficial.acertoDeCicloEntreRecorrentes,
      },
      linhaDeBase: {
        nome: 'Repetição textual da descrição',
        verdadeirosPositivos: base.verdadeirosPositivos,
        verdadeirosNegativos: base.verdadeirosNegativos,
        falsosPositivos: base.falsosPositivos,
        falsosNegativos: base.falsosNegativos,
        acuracia: base.acuracia,
        precisao: base.precisao,
        recall: base.recall,
        f1: base.f1,
      },
      matrizConfusao: {
        realRecorrentePreditoRecorrente: h.verdadeirosPositivos,
        realRecorrentePreditoNao: h.falsosNegativos,
        realNaoPreditoRecorrente: h.falsosPositivos,
        realNaoPreditoNao: h.verdadeirosNegativos,
      },
      observacao:
        'TESTE OFICIAL INDEPENDENTE. Regras congeladas. Métricas = acordo com gabarito sintético controlado.',
    },
    desenvolvimento: {
      identificacao: 'Conjunto de desenvolvimento (N = 21)',
      papel: 'ajuste-regressao',
      totalCasos: dev.totalCasos,
      totalTransacoes: 59,
      ruidoForaAvaliacao: 2,
      recorrentes: 10,
      naoRecorrentes: 11,
      verdadeirosPositivos: dev.verdadeirosPositivos,
      verdadeirosNegativos: dev.verdadeirosNegativos,
      falsosPositivos: dev.falsosPositivos,
      falsosNegativos: dev.falsosNegativos,
      acuracia: dev.acuracia,
      precisao: dev.precisao,
      recall: dev.recall,
      f1: dev.f1,
      observacao:
        'Serve ao ajuste das regras. NÃO é evidência independente. Evidência formal = held-out 2027.',
    },
    estabilidade: estabilidade(),
    criterios: {
      toleranciaPadrao: 0.15,
      toleranciaConsumo: 0.35,
      folgaAbsolutaReais: 2,
      intervaloMensalDias: [25, 36],
      intervaloBimestralDias: [55, 75],
      intervaloAnualDias: [340, 390],
      ocorrenciasMinimas: 3,
      ocorrenciasComAtalho: 2,
      atalhoAnualOuSubscriptions: true,
      fonte: 'avaliacao/apendice-reproducao/REGRAS-CONGELADAS.md',
    },
    avaliacaoReal: {
      disponivelNoRepositorio: false,
      observacao:
        'A rotina scripts/avaliacao-real existe para extrato anonimizado local, mas metricas_reais.json não está versionado. Nenhum número de “avaliação real” é inventado nesta tela.',
    },
  };
}

const DemoAcademicaController = {
  dataset(_req: Request, res: Response) {
    if (recusarSeDesligado(res)) return;
    res.json(obterDatasetDemo());
  },

  executar(_req: Request, res: Response) {
    if (recusarSeDesligado(res)) return;
    res.json(executarDemo());
  },

  metricas(_req: Request, res: Response) {
    if (recusarSeDesligado(res)) return;
    res.json(metricasOficiais());
  },
};

export default DemoAcademicaController;
