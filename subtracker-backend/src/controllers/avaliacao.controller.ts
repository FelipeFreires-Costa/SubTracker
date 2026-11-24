import fs from 'fs';
import path from 'path';
import type { Request, Response } from 'express';
import { avaliarHeuristica } from '../avaliacao/avaliar.heuristica';
import { avaliarConjuntoTeste } from '../avaliacao/avaliar.teste';
import { avaliacaoApiAtiva } from '../utils/ambiente';

const SEMENTE_OFICIAL = 2027;

function carregarEstabilidade() {
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
        totalFP?: number;
        nSementes?: number;
        totalCasos?: number;
      };
    };

    const resumo = bruto.resumo;
    if (!resumo) return null;

    return {
      nSementes: resumo.nSementes ?? 15,
      nPorSemente: bruto.nPorSemente ?? 120,
      totalCasos: resumo.totalCasos ?? 1800,
      meanAcc: resumo.meanAcc ?? null,
      minAcc: resumo.minAcc ?? null,
      maxAcc: resumo.maxAcc ?? null,
      totalFP: resumo.totalFP ?? null,
    };
  } catch {
    return null;
  }
}

function payloadOficial() {
  const relatorio = avaliarConjuntoTeste(SEMENTE_OFICIAL);
  const h = relatorio.heuristica;
  const base = relatorio.linhaDeBase;

  return {
    papel: 'teste-independente-oficial' as const,
    semente: SEMENTE_OFICIAL,
    geradoEm: relatorio.geradoEm,
    totalCasos: relatorio.totalCasos,
    totalTransacoes: relatorio.totalTransacoes,
    perfis: relatorio.perfis,
    mesesPorPerfil: relatorio.mesesPorPerfil,
    verdadeirosPositivos: h.verdadeirosPositivos,
    verdadeirosNegativos: h.verdadeirosNegativos,
    falsosPositivos: h.falsosPositivos,
    falsosNegativos: h.falsosNegativos,
    acuracia: h.acuracia,
    precisao: h.precisao,
    recall: h.recall,
    f1: h.f1,
    acertoDeCicloEntreRecorrentes: relatorio.acertoDeCicloEntreRecorrentes,
    observacao:
      'TESTE OFICIAL INDEPENDENTE (semente 2027, held-out). Regras congeladas. ' +
      'N=21 (desenvolvimento) e semente 2026 (exploração) NÃO são evidência independente. ' +
      'Métricas = acordo com gabarito sintético, não acurácia em extratos reais / Open Finance.',
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
      casosCorrigidos: [] as string[],
    },
    estabilidade: carregarEstabilidade(),
    // Lista resumida: só erros (oficialmente FP/FN = 0; mantém transparência se mudar)
    linhas: relatorio.linhas
      .filter((linha) => linha.veredito === 'FP' || linha.veredito === 'FN')
      .map((linha) => ({
        nome: `${linha.perfil} · ${linha.nome}`,
        esperado: linha.esperado,
        obtido: linha.obtido,
        veredito: linha.veredito,
        periodicidadeEsperada: linha.periodicidadeEsperada,
        periodicidadeObtida: linha.periodicidadeObtida,
        cicloCorreto: linha.cicloCorreto,
        ocorrencias: linha.transacoes,
      })),
  };
}

function payloadDesenvolvimento() {
  const relatorio = avaliarHeuristica();
  return {
    ...relatorio,
    papel: 'desenvolvimento-regressao' as const,
    semente: null,
    totalTransacoes: null,
    estabilidade: null,
    observacao:
      'Conjunto de desenvolvimento (N=21). Serve à regressão/ajuste — NÃO é evidência independente. ' +
      'A evidência formal é o held-out semente 2027 (GET /heuristica/avaliacao).',
  };
}

const AvaliacaoController = {
  obter(req: Request, res: Response) {
    if (!avaliacaoApiAtiva()) {
      res.status(404).json({ erro: 'Avaliação desativada neste ambiente.' });
      return;
    }

    const conjunto = String(req.query.conjunto || 'oficial').toLowerCase();
    if (conjunto === 'dev' || conjunto === 'desenvolvimento' || conjunto === 'n21') {
      res.json(payloadDesenvolvimento());
      return;
    }

    res.json(payloadOficial());
  },
};

export default AvaliacaoController;
