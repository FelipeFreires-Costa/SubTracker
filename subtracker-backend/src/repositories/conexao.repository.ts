import db, { type DbExecutor } from '../config/database';

export interface SaldoBancario {
  nome: string;
  tipo: 'banco' | 'cartao';
  saldo: number;
}

export interface ResumoAnalise {
  transacoesAnalisadas: number;
  recorrentesEncontradas: number;
  eventuaisDescartadas: number;
}

export interface ConexaoOpenFinance {
  itemId: string;
  sincronizadoEm: string;
  transacoesAnalisadas: number | null;
  recorrentesEncontradas: number | null;
  eventuaisDescartadas: number | null;
  saldos: SaldoBancario[];
}

interface ConexaoRow {
  item_id: string;
  sincronizado_em: Date | string;
  transacoes_analisadas?: number | string | null;
  recorrentes_encontradas?: number | string | null;
  eventuais_descartadas?: number | string | null;
  saldos?: string | SaldoBancario[] | null;
}

function bancoIndisponivel(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error.code === '42P01' || error.code === 'ECONNREFUSED')
  );
}

function colunaAusente(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '42703';
}

function numeroOuNulo(valor: number | string | null | undefined): number | null {
  if (valor === null || valor === undefined || valor === '') return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

function mapConexao(row: ConexaoRow): ConexaoOpenFinance {
  const sincronizadoEm =
    row.sincronizado_em instanceof Date
      ? row.sincronizado_em.toISOString()
      : String(row.sincronizado_em);

  return {
    itemId: row.item_id,
    sincronizadoEm,
    transacoesAnalisadas: numeroOuNulo(row.transacoes_analisadas),
    recorrentesEncontradas: numeroOuNulo(row.recorrentes_encontradas),
    eventuaisDescartadas: numeroOuNulo(row.eventuais_descartadas),
    saldos: lerSaldos(row.saldos),
  };
}

function lerSaldos(valor: string | SaldoBancario[] | null | undefined): SaldoBancario[] {
  if (!valor) return [];
  if (Array.isArray(valor)) return valor;
  try {
    const parsed = JSON.parse(valor) as SaldoBancario[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const ConexaoRepository = {
  async obter(): Promise<ConexaoOpenFinance | null> {
    try {
      const result = await db.query(
        `SELECT item_id, sincronizado_em,
                transacoes_analisadas, recorrentes_encontradas, eventuais_descartadas, saldos
         FROM conexao_open_finance WHERE id = 1`,
      );

      if (result.rows.length === 0) {
        return null;
      }

      return mapConexao(result.rows[0]);
    } catch (error) {
      if (bancoIndisponivel(error)) {
        return null;
      }
      if (colunaAusente(error)) {
        const fallback = await db.query(
          'SELECT item_id, sincronizado_em FROM conexao_open_finance WHERE id = 1',
        );
        if (fallback.rows.length === 0) return null;
        return mapConexao(fallback.rows[0]);
      }
      throw error;
    }
  },

  async salvar(itemId: string, resumo?: ResumoAnalise, executor: DbExecutor = db): Promise<boolean> {
    try {
      await executor.query(
        `INSERT INTO conexao_open_finance
          (id, item_id, sincronizado_em, transacoes_analisadas, recorrentes_encontradas, eventuais_descartadas, saldos)
         VALUES (1, $1, NOW(), $2, $3, $4, $5)
         ON CONFLICT (id)
         DO UPDATE SET
           item_id = EXCLUDED.item_id,
           sincronizado_em = NOW(),
           transacoes_analisadas = EXCLUDED.transacoes_analisadas,
           recorrentes_encontradas = EXCLUDED.recorrentes_encontradas,
           eventuais_descartadas = EXCLUDED.eventuais_descartadas,
           saldos = EXCLUDED.saldos`,
        [
          itemId,
          resumo?.transacoesAnalisadas ?? null,
          resumo?.recorrentesEncontradas ?? null,
          resumo?.eventuaisDescartadas ?? null,
          JSON.stringify([]),
        ],
      );
      return true;
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === '42P01'
      ) {
        return false;
      }
      throw error;
    }
  },

  async remover(): Promise<boolean> {
    const result = await db.query(
      'DELETE FROM conexao_open_finance WHERE id = 1 RETURNING id',
    );
    return result.rows.length > 0;
  },
};

export default ConexaoRepository;
