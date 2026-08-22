const REGRAS_CATEGORIA: Array<{ palavras: string[]; categoria: string }> = [
  { palavras: ['netflix', 'spotify', 'disney', 'hbo', 'prime', 'amazon prime'], categoria: 'Streaming' },
  { palavras: ['gympass', 'smartfit', 'academia'], categoria: 'Outros' },
];

export function inferirCategoria(descricao: string): string {
  const texto = descricao.toLowerCase();

  for (const regra of REGRAS_CATEGORIA) {
    if (regra.palavras.some((palavra) => texto.includes(palavra))) {
      return regra.categoria;
    }
  }

  return 'Streaming';
}

export function formatarNomeServico(descricao: string): string {
  return descricao.trim().replace(/\s+/g, ' ');
}

export function normalizarNome(descricao: string): string {
  return descricao.toLowerCase().replace(/[^a-z0-9]/g, '');
}
