import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { decodificarArquivo, parsearCsv } from './csv';
import { excelSerialParaIso, parsearData, parsearValor } from './valores';

export type FormatoEntrada = 'csv' | 'xlsx' | 'ofx';

export interface TransacaoBruta {
  date: string;
  description: string;
  amount: number;
  account_type: string;
  original_category: string;
}

export interface MapeamentoColunas {
  date: string;
  description: string;
  amount: string;
  account_type: string;
  original_category: string;
}

export interface RelatorioImportacao {
  arquivo: string;
  formato: FormatoEntrada;
  colunas: string[];
  mapeamento: MapeamentoColunas;
  transacoes: TransacaoBruta[];
  amostras: TransacaoBruta[];
  positivos: number;
  negativos: number;
  zeros: number;
  avisos: string[];
}

export function detectarFormato(arquivo: string): FormatoEntrada {
  const ext = path.extname(arquivo).toLowerCase();
  if (ext === '.xlsx' || ext === '.xls') return 'xlsx';
  if (ext === '.ofx' || ext === '.qfx') return 'ofx';
  if (ext === '.csv') return 'csv';

  const inicio = fs.readFileSync(arquivo).subarray(0, 800).toString('latin1');
  if (/OFXHEADER|<\s*OFX/i.test(inicio)) return 'ofx';
  if (inicio.startsWith('PK')) return 'xlsx';
  return 'csv';
}

export function importarExtrato(arquivo: string): RelatorioImportacao {
  const formato = detectarFormato(arquivo);
  if (formato === 'ofx') return importarOfx(arquivo);
  if (formato === 'xlsx') return importarXlsx(arquivo);
  return importarCsv(arquivo);
}

function importarCsv(arquivo: string): RelatorioImportacao {
  const { colunas, linhas } = parsearCsv(decodificarArquivo(fs.readFileSync(arquivo)));
  if (colunas.length === 0) {
    throw new Error('CSV sem colunas. Verifique o arquivo exportado pelo banco.');
  }
  return montarRelatorio(arquivo, 'csv', colunas, linhas);
}

function importarOfx(arquivo: string): RelatorioImportacao {
  const texto = decodificarArquivo(fs.readFileSync(arquivo));
  const blocos = texto.split(/<STMTTRN>/i).slice(1);
  const linhas: Record<string, string>[] = [];

  for (const bloco of blocos) {
    const corpo = bloco.split(/<\/STMTTRN>/i)[0] ?? bloco;
    const memo = campoOfx(corpo, 'MEMO');
    const nome = campoOfx(corpo, 'NAME');
    linhas.push({
      date: campoOfx(corpo, 'DTPOSTED'),
      description: memo || nome,
      amount: campoOfx(corpo, 'TRNAMT'),
      account_type: '',
      original_category: campoOfx(corpo, 'TRNTYPE'),
    });
  }

  if (linhas.length === 0) {
    throw new Error('OFX sem <STMTTRN>. O arquivo não parece um extrato de transações.');
  }

  return montarRelatorio(arquivo, 'ofx', ['date', 'description', 'amount', 'account_type', 'original_category'], linhas, {
    date: 'date',
    description: 'description',
    amount: 'amount',
    account_type: 'account_type',
    original_category: 'original_category',
  });
}

function campoOfx(bloco: string, tag: string): string {
  const comFechamento = bloco.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i'));
  if (comFechamento) return (comFechamento[1] ?? '').trim();
  const sgml = bloco.match(new RegExp(`<${tag}>([^<\\r\\n]+)`, 'i'));
  return (sgml?.[1] ?? '').trim();
}

function importarXlsx(arquivo: string): RelatorioImportacao {
  const buffer = fs.readFileSync(arquivo);
  if (!buffer.subarray(0, 2).equals(Buffer.from('PK'))) {
    throw new Error('Este .xls não é o formato Open XML. Exporte de novo como .xlsx, .csv ou .ofx.');
  }
  const zip = lerZip(buffer);
  const shared = zip.get('xl/sharedStrings.xml');
  const strings = shared ? lerSharedStrings(shared.toString('utf8')) : [];
  const sheetNome =
    [...zip.keys()].find((nome) => /^xl\/worksheets\/sheet1\.xml$/i.test(nome)) ??
    [...zip.keys()].find((nome) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(nome));
  if (!sheetNome) {
    throw new Error('XLSX sem planilha. Exporte novamente ou use CSV/OFX.');
  }
  const tabela = lerPlanilha(zip.get(sheetNome)!.toString('utf8'), strings);
  if (tabela.length === 0) {
    throw new Error('Planilha vazia.');
  }
  const colunas = tabela[0]!.map((item, indice) => item.trim() || `coluna_${indice + 1}`);
  const linhas = tabela.slice(1).map((valores) => {
    const linha: Record<string, string> = {};
    colunas.forEach((coluna, indice) => {
      linha[coluna] = (valores[indice] ?? '').trim();
    });
    return linha;
  });
  return montarRelatorio(arquivo, 'xlsx', colunas, linhas);
}

function montarRelatorio(
  arquivo: string,
  formato: FormatoEntrada,
  colunas: string[],
  linhas: Record<string, string>[],
  mapeamentoFixo?: MapeamentoColunas,
): RelatorioImportacao {
  const mapeamento = mapeamentoFixo ?? inferirMapeamento(colunas, linhas);
  const avisos: string[] = [];
  if (!mapeamento.date) avisos.push('Não identifiquei a coluna de data.');
  if (!mapeamento.description) avisos.push('Não identifiquei a coluna de descrição.');
  if (!mapeamento.amount) avisos.push('Não identifiquei a coluna de valor.');

  const transacoes: TransacaoBruta[] = [];
  for (const linha of linhas) {
    const date = parsearData(mapeamento.date ? linha[mapeamento.date] ?? '' : '');
    const amount = parsearValor(mapeamento.amount ? linha[mapeamento.amount] ?? '' : '');
    const description = mapeamento.description ? linha[mapeamento.description] ?? '' : '';
    if (!date || amount == null || !description.trim()) continue;
    transacoes.push({
      date,
      description: description.trim(),
      amount,
      account_type: mapeamento.account_type ? linha[mapeamento.account_type] ?? '' : '',
      original_category: mapeamento.original_category ? linha[mapeamento.original_category] ?? '' : '',
    });
  }

  transacoes.sort((a, b) => a.date.localeCompare(b.date) || a.description.localeCompare(b.description));

  const positivos = transacoes.filter((item) => item.amount > 0).length;
  const negativos = transacoes.filter((item) => item.amount < 0).length;
  const zeros = transacoes.filter((item) => item.amount === 0).length;

  if (transacoes.length === 0) {
    avisos.push('Nenhuma transação válida depois do mapeamento. Confira as colunas detectadas.');
  }
  if (positivos > 0 && negativos === 0) {
    avisos.push(
      'Todos os valores vieram positivos. Se for fatura de cartão, defina account_type_default=CREDIT no config.json. Se for conta corrente com despesa positiva, use inverter_sinal=true.',
    );
  }

  return {
    arquivo,
    formato,
    colunas,
    mapeamento,
    transacoes,
    amostras: transacoes.slice(0, 5),
    positivos,
    negativos,
    zeros,
    avisos,
  };
}

function inferirMapeamento(colunas: string[], linhas: Record<string, string>[]): MapeamentoColunas {
  const amostras = linhas.slice(0, 30);
  const pontuacao = colunas.map((coluna) => ({
    coluna,
    date: pontuarData(coluna, amostras),
    description: pontuarDescricao(coluna, amostras),
    amount: pontuarValor(coluna, amostras),
    account_type: pontuarTipoConta(coluna),
    original_category: pontuarCategoria(coluna),
  }));

  const escolher = (campo: 'date' | 'description' | 'amount' | 'account_type' | 'original_category', minimo: number) => {
    const ordenado = [...pontuacao].sort((a, b) => b[campo] - a[campo]);
    const vencedor = ordenado[0];
    return vencedor && vencedor[campo] >= minimo ? vencedor.coluna : '';
  };

  return {
    date: escolher('date', 2),
    description: escolher('description', 2),
    amount: escolher('amount', 2),
    account_type: escolher('account_type', 3),
    original_category: escolher('original_category', 3),
  };
}

function pontuarData(coluna: string, amostras: Record<string, string>[]): number {
  const nome = normalizarNomeColuna(coluna);
  let pontos = 0;
  if (/(^|_)(data|date|dtposted|dt_posted|dtlanc|lancamento)(_|$)/.test(nome) || nome.includes('data')) pontos += 4;
  if (nome.includes('venc') || nome.includes('compens')) pontos -= 1;
  const validas = amostras.filter((linha) => parsearData(linha[coluna] ?? '')).length;
  pontos += Math.min(4, validas);
  return pontos;
}

function pontuarDescricao(coluna: string, amostras: Record<string, string>[]): number {
  const nome = normalizarNomeColuna(coluna);
  let pontos = 0;
  if (/(desc|histor|memo|titulo|title|lancamento|estabelecimento|nome|merchant)/.test(nome)) pontos += 4;
  const textos = amostras
    .map((linha) => linha[coluna] ?? '')
    .filter((valor) => /[A-Za-zÁ-ú]{3,}/.test(valor) && parsearValor(valor) == null);
  pontos += Math.min(4, Math.floor(textos.length / 3));
  if (/(id|cpf|cnpj|documento|conta|agencia)/.test(nome)) pontos -= 3;
  return pontos;
}

function pontuarValor(coluna: string, amostras: Record<string, string>[]): number {
  const nome = normalizarNomeColuna(coluna);
  let pontos = 0;
  if (/(valor|amount|trnamt|value|vlr)/.test(nome)) pontos += 4;
  if (/(saldo|balance)/.test(nome)) pontos -= 4;
  const validos = amostras.filter((linha) => parsearValor(linha[coluna] ?? '') != null).length;
  pontos += Math.min(4, validos);
  return pontos;
}

function pontuarTipoConta(coluna: string): number {
  const nome = normalizarNomeColuna(coluna);
  if (/(tipo.?conta|account.?type|cartao|credit|corrente|checking)/.test(nome)) return 5;
  return 0;
}

function pontuarCategoria(coluna: string): number {
  const nome = normalizarNomeColuna(coluna);
  if (/(categ|classific)/.test(nome)) return 5;
  return 0;
}

function normalizarNomeColuna(coluna: string): string {
  return coluna
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_');
}

function lerSharedStrings(xml: string): string[] {
  const itens: string[] = [];
  const blocos = xml.match(/<si\b[\s\S]*?<\/si>/gi) ?? [];
  for (const bloco of blocos) {
    const textos = [...bloco.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/gi)].map((m) => decodificarXml(m[1] ?? ''));
    itens.push(textos.join(''));
  }
  return itens;
}

function lerPlanilha(xml: string, strings: string[]): string[][] {
  const linhas = new Map<number, Map<number, string>>();
  const celulas = xml.match(/<(?:\w+:)?c\b[^>]*\/?>[\s\S]*?(?:<\/(?:\w+:)?c>)?/gi) ?? [];

  for (const celula of celulas) {
    const ref = atributo(celula, 'r');
    if (!ref) continue;
    const { linha, coluna } = celulaRef(ref);
    const tipo = atributo(celula, 't');
    let valor = '';
    if (tipo === 's') {
      const indice = Number(conteudoTag(celula, 'v'));
      valor = strings[indice] ?? '';
    } else if (tipo === 'inlineStr') {
      valor = [...celula.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/gi)].map((m) => decodificarXml(m[1] ?? '')).join('');
    } else {
      valor = conteudoTag(celula, 'v');
      if (tipo !== 'str' && /^\d+(\.\d+)?$/.test(valor)) {
        const numero = Number(valor);
        if (numero > 20000 && numero < 80000 && numero === Math.floor(numero)) {
          valor = excelSerialParaIso(numero);
        }
      }
    }
    if (!linhas.has(linha)) linhas.set(linha, new Map());
    linhas.get(linha)!.set(coluna, valor);
  }

  const indices = [...linhas.keys()].sort((a, b) => a - b);
  return indices.map((indice) => {
    const mapa = linhas.get(indice) ?? new Map();
    const maxCol = Math.max(0, ...mapa.keys());
    const linha: string[] = [];
    for (let coluna = 0; coluna <= maxCol; coluna++) {
      linha.push(mapa.get(coluna) ?? '');
    }
    return linha;
  });
}

function atributo(xml: string, nome: string): string {
  const m = xml.match(new RegExp(`\\b${nome}="([^"]*)"`));
  return m?.[1] ?? '';
}

function conteudoTag(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<(?:\\w+:)?${tag}[^>]*>([\\s\\S]*?)</(?:\\w+:)?${tag}>`, 'i'));
  return decodificarXml((m?.[1] ?? '').trim());
}

function celulaRef(ref: string): { linha: number; coluna: number } {
  const m = ref.match(/^([A-Z]+)(\d+)$/i);
  if (!m) return { linha: 0, coluna: 0 };
  const letras = (m[1] ?? '').toUpperCase();
  let coluna = 0;
  for (const letra of letras) {
    coluna = coluna * 26 + (letra.charCodeAt(0) - 64);
  }
  return { linha: Number(m[2]) - 1, coluna: coluna - 1 };
}

function decodificarXml(texto: string): string {
  return texto
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function lerZip(buffer: Buffer): Map<string, Buffer> {
  const eocd = buffer.lastIndexOf(Buffer.from('PK\x05\x06'));
  if (eocd < 0) {
    throw new Error('Arquivo XLSX inválido (não é ZIP). Se for .xls antigo, exporte de novo como .xlsx ou .csv.');
  }
  const cdOffset = buffer.readUInt32LE(eocd + 16);
  const cdEntries = buffer.readUInt16LE(eocd + 10);
  const arquivos = new Map<string, Buffer>();
  let offset = cdOffset;

  for (let i = 0; i < cdEntries; i++) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error('Diretório central do XLSX corrompido.');
    }
    const method = buffer.readUInt16LE(offset + 10);
    const compSize = buffer.readUInt32LE(offset + 20);
    const nameLen = buffer.readUInt16LE(offset + 28);
    const extraLen = buffer.readUInt16LE(offset + 30);
    const commentLen = buffer.readUInt16LE(offset + 32);
    const localOff = buffer.readUInt32LE(offset + 42);
    const name = buffer.toString('utf8', offset + 46, offset + 46 + nameLen);
    const localNameLen = buffer.readUInt16LE(localOff + 26);
    const localExtraLen = buffer.readUInt16LE(localOff + 28);
    const dataStart = localOff + 30 + localNameLen + localExtraLen;
    const compressed = buffer.subarray(dataStart, dataStart + compSize);
    const data = method === 0 ? Buffer.from(compressed) : zlib.inflateRawSync(compressed);
    arquivos.set(name.replace(/\\/g, '/'), data);
    offset += 46 + nameLen + extraLen + commentLen;
  }

  return arquivos;
}
