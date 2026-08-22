import db from '../config/database';
import type { AtualizarContaInput, Conta, CriarContaInput } from '../types/conta.types';

interface ContaRow {
  id: number;
  nome: string;
  preco: string;
  data: Date;
  pago: boolean;
  categoria: string;
}

function mapConta(row: ContaRow): Conta {
  const data =
    row.data instanceof Date
      ? row.data.toISOString().split('T')[0]
      : String(row.data).split('T')[0];

  return {
    id: row.id,
    nome: row.nome,
    preco: Number(row.preco),
    data: data ?? '',
    pago: row.pago,
    categoria: row.categoria,
  };
}

const ContaRepository = {
  async listar(): Promise<Conta[]> {
    const result = await db.query(
      'SELECT id, nome, preco, data, pago, categoria FROM contas ORDER BY data ASC, id ASC',
    );
    return result.rows.map(mapConta);
  },

  async buscarPorId(id: number): Promise<Conta | null> {
    const result = await db.query(
      'SELECT id, nome, preco, data, pago, categoria FROM contas WHERE id = $1',
      [id],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return mapConta(result.rows[0]);
  },

  async criar(dados: CriarContaInput): Promise<Conta> {
    const result = await db.query(
      `INSERT INTO contas (nome, preco, data, pago, categoria)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nome, preco, data, pago, categoria`,
      [dados.nome, dados.preco, dados.data, dados.pago ?? false, dados.categoria ?? 'Outros'],
    );

    return mapConta(result.rows[0]);
  },

  async atualizar(id: number, dados: AtualizarContaInput): Promise<Conta | null> {
    const result = await db.query(
      `UPDATE contas
       SET nome = $1, preco = $2, data = $3, categoria = $4
       WHERE id = $5
       RETURNING id, nome, preco, data, pago, categoria`,
      [dados.nome, dados.preco, dados.data, dados.categoria ?? 'Outros', id],
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
       RETURNING id, nome, preco, data, pago, categoria`,
      [pago, id],
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
