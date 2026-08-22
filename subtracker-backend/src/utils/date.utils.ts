export function normalizarData(valor: string | Date | unknown): string {
  if (valor instanceof Date) {
    return valor.toISOString().split('T')[0] ?? '';
  }

  if (typeof valor === 'string') {
    return valor.split('T')[0] ?? valor;
  }

  return '';
}
