import fs from 'fs';
import path from 'path';

export const PASTA_AVALIACAO = path.resolve(__dirname, '..');
export const PASTA_ENTRADA = path.join(PASTA_AVALIACAO, 'entrada');
export const PASTA_REPO = path.resolve(PASTA_AVALIACAO, '../../..');
export const ARQUIVO_HEURISTICA = path.resolve(
  PASTA_AVALIACAO,
  '../../src/utils/heuristica.recorrencia.ts',
);

export const ARQUIVO_ANONIMIZADO = path.join(PASTA_AVALIACAO, 'transacoes_reais_anonimizadas.csv');
export const ARQUIVO_GABARITO = path.join(PASTA_AVALIACAO, 'gabarito_manual.csv');
export const ARQUIVO_RESULTADO = path.join(PASTA_AVALIACAO, 'resultado_casos_reais.csv');
export const ARQUIVO_METRICAS = path.join(PASTA_AVALIACAO, 'metricas_reais.json');
export const ARQUIVO_DISTRIBUICAO = path.join(PASTA_AVALIACAO, 'distribuicao_mensal.csv');
export const ARQUIVO_CONGELADO = path.join(PASTA_AVALIACAO, 'algoritmo_congelado.json');
export const PASTA_BACKUP = path.join(PASTA_AVALIACAO, 'backup');
export const ARQUIVO_CONFIG = path.join(PASTA_AVALIACAO, 'config.json');
export const ARQUIVO_CONFIG_EXEMPLO = path.join(PASTA_AVALIACAO, 'config.example.json');
export const ARQUIVO_REDACT = path.join(PASTA_AVALIACAO, 'redact_extra.txt');

export const EXTENSOES_ENTRADA = ['.csv', '.xlsx', '.xls', '.ofx', '.qfx'];

export interface ConfigAvaliacao {
  account_type_default: string;
  inverter_sinal: boolean;
  redact_extra: string[];
}

export function lerConfig(): ConfigAvaliacao {
  const vazio: ConfigAvaliacao = {
    account_type_default: '',
    inverter_sinal: false,
    redact_extra: [],
  };

  if (fs.existsSync(ARQUIVO_CONFIG)) {
    const bruto = JSON.parse(fs.readFileSync(ARQUIVO_CONFIG, 'utf8')) as Partial<ConfigAvaliacao>;
    vazio.account_type_default = String(bruto.account_type_default ?? '');
    vazio.inverter_sinal = Boolean(bruto.inverter_sinal);
    vazio.redact_extra = Array.isArray(bruto.redact_extra)
      ? bruto.redact_extra.map((item) => String(item)).filter(Boolean)
      : [];
  }

  if (fs.existsSync(ARQUIVO_REDACT)) {
    const extras = fs
      .readFileSync(ARQUIVO_REDACT, 'utf8')
      .split(/\r?\n/)
      .map((linha) => linha.trim())
      .filter((linha) => linha && !linha.startsWith('#'));
    vazio.redact_extra.push(...extras);
  }

  return vazio;
}

export function garantirPastas() {
  fs.mkdirSync(PASTA_ENTRADA, { recursive: true });
}

export function listarArquivosEntrada(): string[] {
  garantirPastas();
  return fs
    .readdirSync(PASTA_ENTRADA)
    .filter((nome) => EXTENSOES_ENTRADA.includes(path.extname(nome).toLowerCase()))
    .map((nome) => path.join(PASTA_ENTRADA, nome))
    .sort();
}

export function resolverArquivoEntrada(caminhoOpcional?: string): string {
  if (caminhoOpcional) {
    const absoluto = path.resolve(caminhoOpcional);
    if (!fs.existsSync(absoluto)) {
      throw new Error(`Arquivo não encontrado: ${absoluto}`);
    }
    return absoluto;
  }

  const arquivos = listarArquivosEntrada();
  if (arquivos.length === 0) {
    throw new Error(
      `Nenhum CSV, XLSX ou OFX em ${PASTA_ENTRADA}. Coloque o extrato exportado nessa pasta.`,
    );
  }
  if (arquivos.length > 1) {
    throw new Error(
      `Há ${arquivos.length} arquivos em entrada/. Passe o caminho do que deve ser usado, ou deixe só um.`,
    );
  }
  return arquivos[0] as string;
}
