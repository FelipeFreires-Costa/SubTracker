import { aplicarPeriodo } from './heuristica.recorrencia';
import type { Periodicidade } from '../types/conta.types';

/** Formata Date no calendário local (evita dia −1 com toISOString em fusos como America/Sao_Paulo). */
export function formatarDataLocal(valor: Date): string {
  const ano = valor.getFullYear();
  const mes = String(valor.getMonth() + 1).padStart(2, '0');
  const dia = String(valor.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export function normalizarData(valor: string | Date | unknown): string {
  if (valor instanceof Date) {
    return formatarDataLocal(valor);
  }

  if (typeof valor === 'string') {
    return valor.split('T')[0] ?? valor;
  }

  return '';
}

/** Avança a data de cobrança sem alterar a heurística — só reutiliza aplicarPeriodo. */
export function avancarPorPeriodicidade(iso: string, periodicidade: Periodicidade | null | undefined): string {
  if (periodicidade === 'bimestral') return aplicarPeriodo(iso, 2);
  if (periodicidade === 'anual') return aplicarPeriodo(iso, 12);
  return aplicarPeriodo(iso, 1);
}
