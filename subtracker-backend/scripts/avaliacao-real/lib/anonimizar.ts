import type { TransacaoBruta } from './importar';

const MARCAS_COMERCIAIS = new Set(
  [
    'netflix', 'spotify', 'disney', 'hbo', 'max', 'prime', 'amazon', 'google', 'youtube',
    'apple', 'icloud', 'microsoft', 'xbox', 'adobe', 'canva', 'notion', 'chatgpt', 'openai',
    'enel', 'cemig', 'copel', 'sabesp', 'sanepar', 'vivo', 'claro', 'tim', 'oi', 'algar',
    'nubank', 'itau', 'bradesco', 'santander', 'caixa', 'inter', 'c6', 'picpay', 'mercadopago',
    'ifood', 'uber', 'rappi', '99', 'magazine', 'luiza', 'americanas', 'shopee', 'shein',
    'aliexpress', 'steam', 'playstation', 'nintendo', 'smartfit', 'academia', 'gympass',
    'unimed', 'sulamerica', 'porto', 'seguro', 'condominio', 'aluguel', 'internet', 'fibra',
    'net', 'sky', 'starlink', 'linkedin', 'twitch', 'crunchyroll', 'paramount', 'globoplay',
    'youtube', 'premium', 'office', 'github', 'dropbox', 'icloud', 'deezer', 'tidal',
    'kwai', 'tiktok', 'facebook', 'instagram', 'whatsapp', 'telegram', 'zoom', 'slack',
    'roblox', 'xboxgamepass', 'gamepass', 'kindle', 'audible',
    'brasil', 'brazil', 'ltda', 'eireli', 'mei',
  ].map((item) => item),
);

const VOCABULO_BANCARIO = new Set(
  [
    'pix', 'ted', 'doc', 'tef', 'boleto', 'pagamento', 'pagto', 'pag', 'compra', 'debito',
    'credito', 'cartao', 'fatura', 'tarifa', 'transferencia', 'transf', 'enviado', 'enviada',
    'recebido', 'recebida', 'envio', 'recebimento', 'saque', 'deposito', 'dinheiro', 'estorno',
    'anuidade', 'iof', 'juros', 'multa', 'desconto', 'saldo', 'aplicacao', 'resgate', 'rendimento',
    'mp', 'mercadopago', 'picpay', 'paypal', 'pagseguro', 'stone', 'cielo', 'rede', 'getnet',
    'debauton', 'agendada', 'agendado', 'instantaneo', 'instantanea', 'qrcode', 'qr',
  ],
);

const PARTICULAS = new Set(['da', 'de', 'do', 'dos', 'das', 'e', 'di', 'del', 'du', 'van', 'von']);

export interface TransacaoAnonimizada {
  transaction_id: string;
  date: string;
  description_anonymized: string;
  amount: number;
  account_type: string;
  original_category: string;
}

export function anonimizarTransacoes(
  transacoes: TransacaoBruta[],
  extras: string[] = [],
): TransacaoAnonimizada[] {
  const pessoas = new Map<string, string>();
  const extrasNorm = extras.map(normalizarChave).filter(Boolean);

  return transacoes.map((item, indice) => ({
    transaction_id: `T${String(indice + 1).padStart(4, '0')}`,
    date: item.date,
    description_anonymized: anonimizarDescricao(item.description, pessoas, extrasNorm),
    amount: item.amount,
    account_type: item.account_type,
    original_category: item.original_category,
  }));
}

export function anonimizarDescricao(
  descricao: string,
  pessoas: Map<string, string>,
  extrasNorm: string[],
): string {
  let texto = descricao;

  for (const extra of extrasNorm) {
    if (!extra) continue;
    const original = extrasCorrespondentes(descricao, extra);
    for (const trecho of original) {
      texto = texto.replace(new RegExp(escaparRegex(trecho), 'gi'), identificadorPessoa(pessoas, extra));
    }
  }

  texto = texto.replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, '[DOCUMENTO]');
  texto = texto.replace(/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g, '[DOCUMENTO]');
  texto = texto.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[EMAIL]');
  texto = texto.replace(/\b(?:\+?55\s*)?(?:\(?\d{2}\)?\s*)9?\d{4}[-\s]?\d{4}\b/g, '[TELEFONE]');
  texto = texto.replace(/\b\d{4}(?:[\s-]?\d{4}){3}\b/g, '[CARTAO]');
  texto = texto.replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '[CHAVE]');
  texto = texto.replace(/\b(?:ag[eê]ncia|ag)[:\s.-]*\d{2,6}\b/gi, '[AGENCIA]');
  texto = texto.replace(/\b(?:conta|cc|c\/c)[:\s.-]*\d{3,12}-?\d?\b/gi, '[CONTA]');

  return substituirNomesPessoa(texto, pessoas).replace(/\s{2,}/g, ' ').trim();
}

function extrasCorrespondentes(descricao: string, extraNorm: string): string[] {
  const palavras = descricao.split(/(\s+)/);
  const encontrados: string[] = [];
  const alvo = extraNorm.split(' ').filter(Boolean);
  if (alvo.length === 0) return [];

  const tokens = descricao.split(/\s+/).filter(Boolean);
  for (let i = 0; i <= tokens.length - alvo.length; i++) {
    const fatia = tokens.slice(i, i + alvo.length);
    if (fatia.map((item) => normalizarChave(item)).join(' ') === alvo.join(' ')) {
      encontrados.push(fatia.join(' '));
    }
  }
  void palavras;
  return encontrados;
}

function substituirNomesPessoa(texto: string, pessoas: Map<string, string>): string {
  const tokens = texto.split(/(\s+)/);
  const soPalavras = tokens
    .map((token, indice) => ({ token, indice, palavra: !/^\s+$/.test(token) }))
    .filter((item) => item.palavra);

  let i = 0;
  while (i < soPalavras.length) {
    const inicio = i;
    const acumulado: string[] = [];
    let nomes = 0;

    while (i < soPalavras.length) {
      const atual = soPalavras[i]!.token;
      const chave = normalizarChave(atual);
      if (!chave) break;
      if (PARTICULAS.has(chave) && acumulado.length > 0) {
        acumulado.push(atual);
        i += 1;
        continue;
      }
      if (pareceNome(atual, chave) && !MARCAS_COMERCIAIS.has(chave) && !VOCABULO_BANCARIO.has(chave)) {
        acumulado.push(atual);
        nomes += 1;
        i += 1;
        continue;
      }
      break;
    }

    if (nomes >= 2) {
      while (acumulado.length > 0 && PARTICULAS.has(normalizarChave(acumulado[acumulado.length - 1] ?? ''))) {
        acumulado.pop();
        i -= 1;
      }
      const chavePessoa = acumulado.map((item) => normalizarChave(item)).join(' ');
      const rotulo = identificadorPessoa(pessoas, chavePessoa);
      const primeiro = soPalavras[inicio]!;
      const ultimo = soPalavras[i - 1]!;
      for (let t = primeiro.indice; t <= ultimo.indice; t++) {
        tokens[t] = t === primeiro.indice ? rotulo : '';
      }
    }

    if (i === inicio) i += 1;
  }

  return tokens.join('');
}

function pareceNome(original: string, chave: string): boolean {
  if (chave.length < 2 || chave.length > 20) return false;
  if (!/^[a-záéíóúãõâêôçü]+$/i.test(chave)) return false;
  if (/^\d/.test(chave)) return false;
  return /^[A-ZÁÉÍÓÚÃÕÂÊÔÇÜ][A-Za-zÁ-ú]+$/.test(original) || original === original.toUpperCase();
}

function identificadorPessoa(pessoas: Map<string, string>, chave: string): string {
  const normal = chave.trim();
  const existente = pessoas.get(normal);
  if (existente) return existente;
  const rotulo = `PESSOA_${String(pessoas.size + 1).padStart(3, '0')}`;
  pessoas.set(normal, rotulo);
  return rotulo;
}

function normalizarChave(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function escaparRegex(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
