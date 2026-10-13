import { chaveDescricao } from './heuristica.recorrencia';

const REGRAS_CATEGORIA: Array<{ palavras: string[]; categoria: string }> = [
  { palavras: ['netflix', 'spotify', 'disney', 'hbo', 'prime video', 'amazon prime'], categoria: 'Streaming' },
  { palavras: ['condominio', 'condomínio', 'aluguel', 'luz', 'energia', 'eletrobras', 'enel', 'cemig', 'light', 'saneamento'], categoria: 'Moradia' },
  { palavras: ['ifood', 'rappi', 'uber eats'], categoria: 'Alimentação' },
  { palavras: ['uber trip', '99 app', 'metro'], categoria: 'Transporte' },
  { palavras: ['gympass', 'smartfit', 'academia', 'vivo', 'claro', 'tim'], categoria: 'Outros' },
];

const MARCAS: Array<{ chave: string; nome: string }> = [
  { chave: 'amazonprime', nome: 'Amazon Prime' },
  { chave: 'primevideo', nome: 'Prime Video' },
  { chave: 'disneyplus', nome: 'Disney+' },
  { chave: 'youtube', nome: 'YouTube' },
  { chave: 'netflix', nome: 'Netflix' },
  { chave: 'spotify', nome: 'Spotify' },
  { chave: 'hbo', nome: 'HBO' },
  { chave: 'adobe', nome: 'Adobe' },
  { chave: 'smartfit', nome: 'Smart Fit' },
  { chave: 'gympass', nome: 'Gympass' },
  { chave: 'ifood', nome: 'iFood' },
  { chave: 'uber', nome: 'Uber' },
  { chave: 'vivofibra', nome: 'Vivo Fibra' },
  { chave: 'vivo', nome: 'Vivo' },
  { chave: 'claro', nome: 'Claro' },
  { chave: 'portoseguro', nome: 'Porto Seguro' },
];

export function inferirCategoria(descricao: string): string {
  const texto = descricao.toLowerCase();

  for (const regra of REGRAS_CATEGORIA) {
    if (regra.palavras.some((palavra) => texto.includes(palavra))) {
      return regra.categoria;
    }
  }

  return 'Outros';
}

export function formatarNomeServico(descricao: string): string {
  const chave = chaveDescricao(descricao);
  const marca = MARCAS.find((item) => chave.includes(item.chave));
  if (marca) return marca.nome;

  let texto = descricao.trim();
  texto = texto.replace(/^pix\s+(transf(erencia)?\s+)?/i, '');
  texto = texto.replace(/https?:\/\//gi, '');
  texto = texto.replace(/^www\./i, '');
  texto = texto.replace(/\.(com|br|net|org)\b/gi, ' ');
  texto = texto.replace(/\*+\S+/g, ' ');
  texto = texto.replace(/[_/\-]+/g, ' ');
  texto = texto.replace(/\d{3,}/g, ' ');
  texto = texto.replace(/\s+/g, ' ').trim();

  if (!texto) return descricao.trim();

  return texto
    .split(' ')
    .filter(Boolean)
    .map((palavra, indice) => {
      const minuscula = palavra.toLowerCase();
      if (indice > 0 && ['de', 'da', 'do', 'e', 'em'].includes(minuscula)) {
        return minuscula;
      }
      if (minuscula.length <= 3) {
        return minuscula.toUpperCase();
      }
      return minuscula.charAt(0).toUpperCase() + minuscula.slice(1);
    })
    .join(' ');
}

export function normalizarNome(descricao: string): string {
  return chaveDescricao(descricao);
}
