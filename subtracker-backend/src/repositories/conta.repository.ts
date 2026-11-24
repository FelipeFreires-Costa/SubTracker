import db, { type DbExecutor } from '../config/database';
import { formatarDataLocal } from '../utils/date.utils';
import type {
  AtualizarContaInput,
  Conta,
  CriarContaInput,
  OrigemConta,
  Periodicidade,
  SituacaoConta,
} from '../types/conta.types';

interface ContaRow {
  id: number;
  nome: string;
  preco: string;
  data: Date | string;
  pago: boolean;
  categoria: string;
  recorrente: boolean;
  periodicidade: Periodicidade | null;
  proxima_cobranca: Date | string | null;
  origem: OrigemConta;
  parcela_atual: number | string | null;
  parcela_total: number | string | null;
  ocorrencias: number | string | null;
  primeira_cobranca: Date | string | null;
  total_gasto: string | number | null;
  situacao: SituacaoConta | null;
}

const COLUNAS = `
  id, nome, preco, data, pago, categoria,
  recorrente, periodicidade, proxima_cobranca, origem,
  parcela_atual, parcela_total, ocorrencias, primeira_cobranca, total_gasto, situacao
`;

function mapData(valor: Date | string | null | undefined): string | null {
  if (!valor) return null;

  if (valor instanceof Date) {
    return formatarDataLocal(valor);
  }

  return String(valor).split('T')[0] ?? null;
}

function mapNumero(valor: number | string | null | undefined): number | null {
  if (valor === null || valor === undefined || valor === '') return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

function mapConta(row: ContaRow): Conta {
  return {
    id: row.id,
    nome: row.nome,
    preco: Number(row.preco),
    data: mapData(row.data) ?? '',
    pago: row.pago,
    categoria: row.categoria,
    recorrente: row.recorrente,
    periodicidade: row.periodicidade,
    proximaCobranca: mapData(row.proxima_cobranca),
    origem: row.origem,
    parcelaAtual: mapNumero(row.parcela_atual),
    parcelaTotal: mapNumero(row.parcela_total),
    ocorrencias: mapNumero(row.ocorrencias),
    primeiraCobranca: mapData(row.primeira_cobranca),
    totalGasto: mapNumero(row.total_gasto),
    situacao: row.situacao ?? null,
  };
}

const ContaRepository = {
  async listar(executor: DbExecutor = db): Promise<Conta[]> {
    const result = await executor.query(`SELECT ${COLUNAS} FROM contas ORDER BY data ASC, id ASC`);
    return result.rows.map(mapConta);
  },

  async buscarPorId(id: number, executor: DbExecutor = db): Promise<Conta | null> {
    const result = await executor.query(`SELECT ${COLUNAS} FROM contas WHERE id = $1`, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return mapConta(result.rows[0]);
  },

  async criar(dados: CriarContaInput, executor: DbExecutor = db): Promise<Conta> {
    const proximaCobranca = dados.proximaCobranca ?? dados.data;

    const result = await executor.query(
      `INSERT INTO contas
        (nome, preco, data, pago, categoria, recorrente, periodicidade, proxima_cobranca, origem,
         parcela_atual, parcela_total, ocorrencias, primeira_cobranca, total_gasto, situacao)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING ${COLUNAS}`,
      [
        dados.nome,
        dados.preco,
        dados.data,
        dados.pago ?? false,
        dados.categoria ?? 'Outros',
        dados.recorrente ?? true,
        dados.periodicidade ?? 'mensal',
        proximaCobranca,
        dados.origem ?? 'manual',
        dados.parcelaAtual ?? null,
        dados.parcelaTotal ?? null,
        dados.ocorrencias ?? null,
        dados.primeiraCobranca ?? null,
        dados.totalGasto ?? null,
        dados.situacao ?? null,
      ],
    );

    return mapConta(result.rows[0]);
  },

  async atualizar(id: number, dados: AtualizarContaInput, executor: DbExecutor = db): Promise<Conta | null> {
    const proximaCobranca = dados.proximaCobranca ?? dados.data;

    const result = await executor.query(
      `UPDATE contas
       SET nome = $1, preco = $2, data = $3, categoria = $4, proxima_cobranca = $5, periodicidade = $6
       WHERE id = $7
       RETURNING ${COLUNAS}`,
      [
        dados.nome,
        dados.preco,
        dados.data,
        dados.categoria ?? 'Outros',
        proximaCobranca,
        dados.periodicidade ?? 'mensal',
        id,
      ],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return mapConta(result.rows[0]);
  },

  async atualizarStatus(
    id: number,
    dados: { pago: boolean; data?: string; proximaCobranca?: string | null },
    executor: DbExecutor = db,
  ): Promise<Conta | null> {
    const result = await executor.query(
      `UPDATE contas
       SET pago = $1,
           data = COALESCE($2, data),
           proxima_cobranca = COALESCE($3, proxima_cobranca)
       WHERE id = $4
       RETURNING ${COLUNAS}`,
      [dados.pago, dados.data ?? null, dados.proximaCobranca ?? null, id],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return mapConta(result.rows[0]);
  },

  async atualizarMonitoramento(
    id: number,
    dados: {
      nome?: string;
      preco: number;
      data: string;
      periodicidade: Periodicidade | null;
      proximaCobranca: string;
      pago: boolean;
      recorrente?: boolean;
      parcelaAtual?: number | null;
      parcelaTotal?: number | null;
      ocorrencias?: number | null;
      primeiraCobranca?: string | null;
      totalGasto?: number | null;
      categoria?: string;
      situacao?: SituacaoConta | null;
    },
    executor: DbExecutor = db,
  ): Promise<Conta | null> {
    const result = await executor.query(
      `UPDATE contas
       SET nome = COALESCE($1, nome),
           preco = $2, data = $3, periodicidade = $4, proxima_cobranca = $5, pago = $6,
           recorrente = COALESCE($7, recorrente),
           parcela_atual = $8, parcela_total = $9,
           ocorrencias = $10, primeira_cobranca = $11, total_gasto = $12,
           categoria = COALESCE($13, categoria),
           situacao = $14
       WHERE id = $15
       RETURNING ${COLUNAS}`,
      [
        dados.nome ?? null,
        dados.preco,
        dados.data,
        dados.periodicidade,
        dados.proximaCobranca,
        dados.pago,
        dados.recorrente ?? null,
        dados.parcelaAtual ?? null,
        dados.parcelaTotal ?? null,
        dados.ocorrencias ?? null,
        dados.primeiraCobranca ?? null,
        dados.totalGasto ?? null,
        dados.categoria ?? null,
        dados.situacao ?? null,
        id,
      ],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return mapConta(result.rows[0]);
  },

  async remover(id: number, executor: DbExecutor = db): Promise<boolean> {
    const result = await executor.query('DELETE FROM contas WHERE id = $1 RETURNING id', [id]);
    return result.rows.length > 0;
  },
};

export default ContaRepository;
