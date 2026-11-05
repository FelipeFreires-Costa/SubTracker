import fs from 'fs';

export function decodificarArquivo(buffer: Buffer): string {
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return buffer.subarray(3).toString('utf8');
  }

  const utf8 = buffer.toString('utf8');
  if (utf8.includes('\uFFFD')) {
    return buffer.toString('latin1');
  }
  return utf8.replace(/^\uFEFF/, '');
}

export function detectarSeparador(texto: string): string {
  const primeira = texto.split(/\r?\n/).find((linha) => linha.trim()) ?? '';
  const candidatos: Array<{ sep: string; pontos: number }> = [
    { sep: ';', pontos: 0 },
    { sep: ',', pontos: 0 },
    { sep: '\t', pontos: 0 },
    { sep: '|', pontos: 0 },
  ];

  for (const item of candidatos) {
    item.pontos = contarSeparadores(primeira, item.sep);
  }

  candidatos.sort((a, b) => b.pontos - a.pontos);
  return candidatos[0] && candidatos[0].pontos > 0 ? candidatos[0].sep : ';';
}

function contarSeparadores(linha: string, sep: string): number {
  let n = 0;
  let aspas = false;
  for (let i = 0; i < linha.length; i++) {
    const c = linha[i];
    if (c === '"') {
      aspas = !aspas;
    } else if (!aspas && c === sep) {
      n += 1;
    }
  }
  return n;
}

export function parsearCsv(texto: string, separador?: string): { colunas: string[]; linhas: Record<string, string>[] } {
  const sep = separador ?? detectarSeparador(texto);
  const linhasBrutas = dividirLinhasCsv(texto, sep).filter((linha) => linha.some((celula) => celula.trim() !== ''));
  const cabecalho = linhasBrutas.shift();
  if (!cabecalho || cabecalho.length === 0) {
    return { colunas: [], linhas: [] };
  }

  const colunas = cabecalho.map((item, indice) => item.trim() || `coluna_${indice + 1}`);
  const linhas = linhasBrutas.map((valores) => {
    const linha: Record<string, string> = {};
    colunas.forEach((coluna, indice) => {
      linha[coluna] = (valores[indice] ?? '').trim();
    });
    return linha;
  });

  return { colunas, linhas };
}

function dividirLinhasCsv(texto: string, sep: string): string[][] {
  const resultado: string[][] = [];
  let atual: string[] = [];
  let campo = '';
  let aspas = false;

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspas) {
      if (c === '"') {
        if (texto[i + 1] === '"') {
          campo += '"';
          i += 1;
        } else {
          aspas = false;
        }
      } else {
        campo += c;
      }
      continue;
    }

    if (c === '"') {
      aspas = true;
    } else if (c === sep) {
      atual.push(campo);
      campo = '';
    } else if (c === '\n') {
      atual.push(campo.replace(/\r$/, ''));
      resultado.push(atual);
      atual = [];
      campo = '';
    } else {
      campo += c;
    }
  }

  if (campo !== '' || atual.length > 0) {
    atual.push(campo);
    resultado.push(atual);
  }

  return resultado;
}

export function escaparCsv(valor: string | number | null | undefined): string {
  const texto = valor == null ? '' : String(valor);
  return `"${texto.replace(/"/g, '""')}"`;
}

export function escreverCsv(caminho: string, colunas: string[], linhas: Array<Record<string, string | number | null | undefined>>) {
  const corpo = [
    colunas.map(escaparCsv).join(';'),
    ...linhas.map((linha) => colunas.map((coluna) => escaparCsv(linha[coluna])).join(';')),
  ].join('\n');
  fs.writeFileSync(caminho, `\uFEFF${corpo}\n`, 'utf8');
}

export function lerCsvArquivo(caminho: string): { colunas: string[]; linhas: Record<string, string>[] } {
  return parsearCsv(decodificarArquivo(fs.readFileSync(caminho)));
}
