import ContaRepository from '../repositories/conta.repository';
import ConexaoRepository from '../repositories/conexao.repository';
import PluggyService, { resumirAnalise, type AnaliseRecorrencia } from './pluggy.service';
import { formatarNomeServico, inferirCategoria, normalizarNome } from '../utils/categoria.mapper';
import { hojeIso } from '../utils/heuristica.recorrencia';
import { extratoSandbox, CENARIOS_SANDBOX_CONTAS } from '../sandbox/cenarios.sandbox';
import { AppError } from '../utils/validation';
import type { Conta } from '../types/conta.types';

function chavesDaAssinatura(nomeFormatado: string, chaveGrupo: string): string[] {
  return [...new Set([normalizarNome(nomeFormatado), chaveGrupo].filter(Boolean))];
}

function chavesEquivalentes(a: string, b: string): boolean {
  if (a === b) return true;
  const [menor, maior] = a.length <= b.length ? [a, b] : [b, a];
  return menor.length >= 6 && maior.includes(menor);
}

function localizarExistente(porNome: Map<string, Conta>, chaves: string[]): Conta | undefined {
  for (const chave of chaves) {
    const direto = porNome.get(chave);
    if (direto) return direto;
  }

  for (const [chaveExistente, conta] of porNome) {
    if (chaves.some((chave) => chavesEquivalentes(chave, chaveExistente))) {
      return conta;
    }
  }

  return undefined;
}

/**
 * Marcação manual de "Paguei" só vale enquanto for o mesmo ciclo.
 * Quando o extrato mostra outra última cobrança ou outra data esperada, o banco decide.
 */
function csvCampo(valor: string): string {
  return `"${valor.replace(/"/g, '""')}"`;
}

function pagoAposSincronizar(existente: Conta, ultimaCobranca: string, proximaCobranca: string, pagoDetectado: boolean) {
  const mesmoCiclo = existente.data === ultimaCobranca && existente.proximaCobranca === proximaCobranca;
  return mesmoCiclo ? existente.pago || pagoDetectado : pagoDetectado;
}

async function persistirAnalise(analise: AnaliseRecorrencia) {
  const contasExistentes = await ContaRepository.listar();
  const porNome = new Map(contasExistentes.map((conta) => [normalizarNome(conta.nome), conta]));

  const importadas: Conta[] = [];
  const atualizadas: Conta[] = [];
  const removidas: Conta[] = [];
  let ignoradas = 0;
  const chavesDetectadas = new Set<string>();

  for (const item of analise.recorrentes) {
    for (const chave of chavesDaAssinatura(formatarNomeServico(item.nome), item.chave)) {
      chavesDetectadas.add(chave);
    }
  }

  for (const assinatura of analise.recorrentes) {
    const nome = formatarNomeServico(assinatura.nome);
    const chaves = chavesDaAssinatura(nome, assinatura.chave);
    const existente = localizarExistente(porNome, chaves);

    if (existente && existente.origem !== 'pluggy') {
      ignoradas += 1;
      continue;
    }

    if (existente) {
      const conta = await ContaRepository.atualizarMonitoramento(existente.id, {
        nome,
        preco: Number(assinatura.preco.toFixed(2)),
        data: assinatura.ultimaCobranca,
        periodicidade: assinatura.periodicidade,
        proximaCobranca: assinatura.proximaCobranca,
        pago: pagoAposSincronizar(existente, assinatura.ultimaCobranca, assinatura.proximaCobranca, assinatura.pago),
        recorrente: true,
        parcelaAtual: null,
        parcelaTotal: null,
      });

      if (conta) {
        atualizadas.push(conta);
        for (const chave of chaves) {
          porNome.set(chave, conta);
        }
      }
      continue;
    }

    const conta = await ContaRepository.criar({
      nome,
      preco: Number(assinatura.preco.toFixed(2)),
      data: assinatura.ultimaCobranca,
      pago: assinatura.pago,
      categoria: inferirCategoria(nome),
      recorrente: true,
      periodicidade: assinatura.periodicidade,
      proximaCobranca: assinatura.proximaCobranca,
      origem: 'pluggy',
      parcelaAtual: null,
      parcelaTotal: null,
    });

    importadas.push(conta);
    for (const chave of chaves) {
      porNome.set(chave, conta);
    }
  }

  if (analise.totalTransacoesAnalisadas > 0) {
    const atuais = await ContaRepository.listar();
    const idsCanonico = new Set([...importadas, ...atualizadas].map((conta) => conta.id));

    for (const conta of atuais) {
      if (conta.origem !== 'pluggy') continue;

      const chaveConta = normalizarNome(conta.nome);
      const detectada = [...chavesDetectadas].some((chave) => chavesEquivalentes(chave, chaveConta));
      const manter = detectada && idsCanonico.has(conta.id);

      if (!manter) {
        const apagou = await ContaRepository.remover(conta.id);
        if (apagou) {
          removidas.push(conta);
        }
      }
    }
  }

  console.log(`[IMPORTACAO] Persistindo ${analise.recorrentes.length} assinatura(s) ativa(s).`);

  const partes: string[] = [];
  const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;
  if (importadas.length > 0) partes.push(plural(importadas.length, 'nova', 'novas'));
  if (atualizadas.length > 0) partes.push(plural(atualizadas.length, 'atualizada', 'atualizadas'));
  if (removidas.length > 0) partes.push(plural(removidas.length, 'saiu da lista', 'saíram da lista'));
  if (analise.totalEncerradas > 0) {
    partes.push(plural(analise.totalEncerradas, 'parece cancelada', 'parecem canceladas'));
  }

  const mensagem =
    partes.length > 0
      ? `Pronto: ${partes.join(', ')}.`
      : analise.totalRecorrentes === 0
        ? 'Não encontramos assinaturas ativas neste banco.'
        : 'Suas assinaturas já estão em dia.';

  return {
    mensagem,
    totalAnalisadas: analise.totalTransacoesAnalisadas,
    totalEncontradas: analise.totalRecorrentes,
    totalEncerradas: analise.totalEncerradas,
    totalEventuais: analise.totalEventuais,
    totalImportadas: importadas.length,
    totalAtualizadas: atualizadas.length,
    totalRemovidas: removidas.length,
    totalIgnoradas: ignoradas,
    contas: [...importadas, ...atualizadas],
  };
}

const ImportacaoService = {
  async importarAssinaturas(itemId: string) {
    const id = itemId.trim();

    if (!id) {
      throw new AppError('itemId é obrigatório.');
    }

    const analise = await PluggyService.analisarRecorrencias(id);
    const resultado = await persistirAnalise(analise);

    const conexaoSalva = await ConexaoRepository.salvar(id, {
      transacoesAnalisadas: analise.totalTransacoesAnalisadas,
      recorrentesEncontradas: analise.totalRecorrentes,
      eventuaisDescartadas: Math.max(0, analise.totalEventuais - analise.totalParcelas),
    });

    return conexaoSalva
      ? resultado
      : {
          ...resultado,
          mensagem: `${resultado.mensagem} Rode a migração do banco para poder atualizar depois sem abrir o widget.`,
        };
  },

  /** Extrato de teste gerado em memória, relativo a hoje. Não usa a Pluggy nem salva conexão. */
  async importarSandbox() {
    const hoje = hojeIso();
    const analise = resumirAnalise(extratoSandbox(hoje), CENARIOS_SANDBOX_CONTAS, 'SANDBOX', hoje);
    return persistirAnalise(analise);
  },

  async sincronizarSalva() {
    const conexao = await ConexaoRepository.obter();

    if (!conexao) {
      throw new AppError('Nenhum banco conectado. Abra a conexão primeiro.', 400);
    }

    return this.importarAssinaturas(conexao.itemId);
  },

  async faturaMesAtual() {
    const conexao = await ConexaoRepository.obter();

    if (!conexao) {
      throw new AppError('Nenhum banco conectado. Conecte na tela Contas.', 400);
    }

    return PluggyService.obterFaturaMesAtual(conexao.itemId);
  },

  /** O download do extrato fica desligado, salvo EXTRATO_EXPORT=true no .env. */
  exportacaoAtiva() {
    return process.env.EXTRATO_EXPORT === 'true';
  },

  /** Extrato na hora, para download. Não persiste transações nem roda a heurística. */
  async exportarExtratoCsv() {
    const conexao = await ConexaoRepository.obter();

    if (!conexao) {
      throw new AppError('Nenhum banco conectado. Conecte na tela Contas.', 400);
    }

    const { transacoes } = await PluggyService.listarTransacoes(conexao.itemId);
    const ordenadas = [...transacoes].sort(
      (a, b) => a.date.localeCompare(b.date) || a.description.localeCompare(b.description),
    );

    const linhas = [
      ['Data', 'Descrição', 'Valor', 'Tipo de conta', 'Categoria'].join(';'),
      ...ordenadas.map((item) =>
        [
          csvCampo(item.date),
          csvCampo(item.description),
          csvCampo(item.amount.toFixed(2)),
          csvCampo(item.tipoConta ?? ''),
          csvCampo(item.category ?? ''),
        ].join(';'),
      ),
    ];

    return `\uFEFF${linhas.join('\n')}\n`;
  },

  async statusConexao() {
    const conexao = await ConexaoRepository.obter();

    return {
      conectado: conexao !== null,
      ultimaSincronizacao: conexao?.sincronizadoEm ?? null,
      transacoesAnalisadas: conexao?.transacoesAnalisadas ?? null,
      recorrentesEncontradas: conexao?.recorrentesEncontradas ?? null,
      eventuaisDescartadas: conexao?.eventuaisDescartadas ?? null,
      exportarExtratoAtivo: this.exportacaoAtiva(),
    };
  },

  async desconectar() {
    await ConexaoRepository.remover();
    return {
      conectado: false,
      ultimaSincronizacao: null,
      transacoesAnalisadas: null,
      recorrentesEncontradas: null,
      eventuaisDescartadas: null,
    };
  },
};

export default ImportacaoService;
