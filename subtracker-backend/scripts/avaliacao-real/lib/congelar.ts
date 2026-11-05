import { execSync } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import { ARQUIVO_CONGELADO, ARQUIVO_HEURISTICA, PASTA_REPO } from './caminhos';

export interface AlgoritmoCongelado {
  git_commit: string;
  git_commit_short: string;
  git_commit_date: string;
  git_subject: string;
  heuristica_arquivo: string;
  heuristica_sha256: string;
  frozen_at: string;
}

export function congelarAlgoritmo(): AlgoritmoCongelado {
  const registro = lerEstadoAtual();
  fs.writeFileSync(ARQUIVO_CONGELADO, `${JSON.stringify(registro, null, 2)}\n`, 'utf8');
  return registro;
}

export function lerCongelado(): AlgoritmoCongelado | null {
  if (!fs.existsSync(ARQUIVO_CONGELADO)) return null;
  return JSON.parse(fs.readFileSync(ARQUIVO_CONGELADO, 'utf8')) as AlgoritmoCongelado;
}

export interface SituacaoDoAlgoritmo {
  /** Estado do código no momento da avaliação. */
  atual: AlgoritmoCongelado;
  /** Registro gravado pelo comando anonimizar, se existir. */
  congelado: AlgoritmoCongelado | null;
  /** true quando a heurística mudou depois do congelamento. */
  alterado: boolean;
}

/** Não bloqueia: só informa se o algoritmo é o mesmo do congelamento. */
export function situacaoDoAlgoritmo(): SituacaoDoAlgoritmo {
  const congelado = lerCongelado();
  const atual = lerEstadoAtual();
  const alterado = congelado !== null && atual.heuristica_sha256 !== congelado.heuristica_sha256;
  return { atual, congelado, alterado };
}

function lerEstadoAtual(): AlgoritmoCongelado {
  const git_commit = git('rev-parse HEAD');
  const git_commit_short = git('rev-parse --short HEAD');
  const git_commit_date = git('log -1 --format=%cI');
  const git_subject = git('log -1 --format=%s');
  const heuristica_sha256 = crypto
    .createHash('sha256')
    .update(fs.readFileSync(ARQUIVO_HEURISTICA))
    .digest('hex');

  return {
    git_commit,
    git_commit_short,
    git_commit_date,
    git_subject,
    heuristica_arquivo: 'subtracker-backend/src/utils/heuristica.recorrencia.ts',
    heuristica_sha256,
    frozen_at: new Date().toISOString(),
  };
}

function git(args: string): string {
  return execSync(`git ${args}`, { cwd: PASTA_REPO, encoding: 'utf8' }).trim();
}
