import db from '../config/database';
import type {
  AtualizarContaInput,
  Conta,
  CriarContaInput,
  OrigemConta,
  Periodicidade,
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
}

const COLUNAS = `
  id, nome, preco, data, pago, categoria,
  recorrente, periodicidade, proxima_cobranca, origem,
  parcela_atual, parcela_total
`;

function mapData(valor: Date | string | null | undefined): string | null {
  if (!valor) return null;

  if (valor instanceof Date) {
    return valor.toISOString().split('T')[0] ?? null;
  }

  return String(valor).split('T')[0] ?? null;
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
    parcelaAtual: row.parcela_atual === null || row.parcela_atual === undefined ? null : Number(row.parcela_atual),
    parcelaTotal: row.parcela_total === null || row.parcela_total === undefined ? null : Number(row.parcela_total),
  };
}

const ContaRepository = {
  async listar(): Promise<Conta[]> {
    const result = await db.query(`SELECT ${COLUNAS} FROM contas ORDER BY data ASC, id ASC`);
    return result.rows.map(mapConta);
  },

  async buscarPorId(id: number): Promise<Conta | null> {
    const result = await db.query(`SELECT ${COLUNAS} FROM contas WHERE id = $1`, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return mapConta(result.rows[0]);
  },

  async criar(dados: CriarContaInput): Promise<Conta> {
    const proximaCobranca = dados.proximaCobranca ?? dados.data;

    const result = await db.query(
      `INSERT INTO contas
        (nome, preco, data, pago, categoria, recorrente, periodicidade, proxima_cobranca, origem, parcela_atual, parcela_total)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
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
      ],
    );

    return mapConta(result.rows[0]);
  },

  async atualizar(id: number, dados: AtualizarContaInput): Promise<Conta | null> {
    const proximaCobranca = dados.proximaCobranca ?? dados.data;

    const result = await db.query(
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

  async atualizarStatus(id: number, pago: boolean): Promise<Conta | null> {
    const result = await db.query(
      `UPDATE contas
       SET pago = $1
       WHERE id = $2
       RETURNING ${COLUNAS}`,
      [pago, id],
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
    },
  ): Promise<Conta | null> {
    const result = await db.query(
      `UPDATE contas
       SET nome = COALESCE($1, nome),
           preco = $2, data = $3, periodicidade = $4, proxima_cobranca = $5, pago = $6,
           recorrente = COALESCE($7, recorrente),
           parcela_atual = $8, parcela_total = $9
       WHERE id = $10
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
        id,
      ],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return mapConta(result.rows[0]);
  },

  async remover(id: number): Promise<boolean> {
    const result = await db.query('DELETE FROM contas WHERE id = $1 RETURNING id', [id]);
    return result.rows.length > 0;
  },
};

export default ContaRepository;
