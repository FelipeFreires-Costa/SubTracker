import {
  aplicarPeriodo,
  chaveDescricao,
  hojeIso,
  identificarRecorrencias,
  type Periodicidade,
  type Situacao,
  type TransacaoAnalise,
} from '../utils/heuristica.recorrencia';

export type EsperadoSandbox = Situacao | 'eventual';

export interface CenarioSandbox {
  nome: string;
  esperado: EsperadoSandbox;
  motivo: string;
  transacoes: TransacaoAnalise[];
}

/** Conta corrente + cartão, como o Pluggy Bank devolve. */
export const CENARIOS_SANDBOX_CONTAS = 2;

function dataRelativa(hoje: string, mesesAtras: number, diasAtras = 0): string {
  const base = new Date(`${aplicarPeriodo(hoje, -mesesAtras)}T00:00:00`);
  base.setDate(base.getDate() - diasAtras);
  return hojeIso(base);
}

function serie(
  hoje: string,
  descricao: string,
  valores: number[],
  pontos: Array<[meses: number, dias: number]>,
  categoria: string,
  tipoConta?: 'CREDIT',
): TransacaoAnalise[] {
  return pontos.map(([meses, dias], indice) => ({
    description: descricao,
    amount: valores[indice % valores.length] ?? valores[0] ?? 0,
    date: dataRelativa(hoje, meses, dias),
    category: categoria,
    tipoConta,
  }));
}

export function cenariosSandbox(hoje = hojeIso()): CenarioSandbox[] {
  return [
    {
      nome: 'Netflix',
      esperado: 'ativa',
      motivo: 'Cobrou há 5 dias; próxima daqui a ~1 mês.',
      transacoes: serie(hoje, 'NETFLIX.COM', [-55.9], [[4, 5], [3, 5], [2, 5], [1, 5], [0, 5]], 'Subscriptions'),
    },
    {
      nome: 'Spotify',
      esperado: 'pendente',
      motivo: 'Cobrança esperada há 3 dias e ainda não apareceu.',
      transacoes: serie(hoje, 'SPOTIFY', [-21.9], [[4, 3], [3, 3], [2, 3], [1, 3]], 'Subscriptions'),
    },
    {
      nome: 'Disney+ (cancelada há meses)',
      esperado: 'encerrada',
      motivo: 'Última cobrança há 4 meses.',
      transacoes: serie(hoje, 'DISNEY PLUS', [-33.9], [[7, 0], [6, 0], [5, 0], [4, 0]], 'Subscriptions'),
    },
    {
      nome: 'HBO Max (cancelada no mês passado)',
      esperado: 'encerrada',
      motivo: 'Cobrança esperada há 20 dias, acima da tolerância de 10.',
      transacoes: serie(hoje, 'HBO MAX', [-34.9], [[3, 20], [2, 20], [1, 20]], 'Subscriptions'),
    },
    {
      nome: 'Adobe (anual)',
      esperado: 'ativa',
      motivo: 'Cobrado há 11 e 23 meses; renova no mês que vem.',
      transacoes: serie(hoje, 'ADOBE SYSTEMS', [-588], [[23, 0], [11, 0]], 'Subscriptions'),
    },
    {
      nome: 'Seguro auto (anual cancelado)',
      esperado: 'encerrada',
      motivo: 'Renovação era há 2 meses e não veio.',
      transacoes: serie(hoje, 'PORTO SEGURO AUTO', [-1240], [[26, 0], [14, 0]], 'Insurance'),
    },
    {
      nome: 'Smart Fit (bimestral)',
      esperado: 'ativa',
      motivo: 'Cobra a cada 2 meses; última há 10 dias.',
      transacoes: serie(hoje, 'SMART FIT', [-119.9], [[4, 10], [2, 10], [0, 10]], 'Sports'),
    },
    {
      nome: 'Vivo Fibra (reajuste)',
      esperado: 'ativa',
      motivo: 'Subiu de 89,90 para 119,90; as três últimas são iguais.',
      transacoes: serie(
        hoje,
        'VIVO FIBRA',
        [-89.9, -89.9, -89.9, -119.9, -119.9, -119.9],
        [[5, 2], [4, 2], [3, 2], [2, 2], [1, 2], [0, 2]],
        'Telecommunications',
      ),
    },
    {
      nome: 'Enel (conta de luz variável)',
      esperado: 'ativa',
      motivo: 'Valor muda com o consumo; tolerância maior para Electricity.',
      transacoes: serie(
        hoje,
        'ENEL DISTRIBUICAO CE',
        [-180.4, -212.9, -165.3, -238.1, -199.0],
        [[4, 12], [3, 12], [2, 12], [1, 12], [0, 12]],
        'Electricity',
      ),
    },
    {
      nome: 'Academia (pulou um mês)',
      esperado: 'ativa',
      motivo: 'Um mês sem cobrança no meio não derruba a assinatura.',
      transacoes: serie(hoje, 'ACADEMIA BODY TECH', [-149.9], [[4, 6], [3, 6], [1, 6], [0, 6]], 'Sports'),
    },
    {
      nome: 'YouTube Premium (cartão)',
      esperado: 'ativa',
      motivo: 'No cartão a despesa vem positiva.',
      transacoes: serie(hoje, 'YOUTUBEPREMIUM', [24.9], [[2, 8], [1, 8], [0, 8]], 'Subscriptions', 'CREDIT'),
    },
    {
      nome: 'ChatGPT Plus (nova)',
      esperado: 'ativa',
      motivo: 'Só duas cobranças, mas categoria Subscriptions.',
      transacoes: serie(hoje, 'OPENAI CHATGPT SUBSCR', [104.9], [[1, 4], [0, 4]], 'Subscriptions', 'CREDIT'),
    },
    {
      nome: 'PIX aluguel',
      esperado: 'ativa',
      motivo: 'PIX com descrição de conta continua.',
      transacoes: serie(hoje, 'PIX ALUGUEL APTO', [-1500], [[3, 1], [2, 1], [1, 1], [0, 1]], 'Transfer'),
    },
    {
      nome: 'PIX para Irene Lopes',
      esperado: 'eventual',
      motivo: 'PIX para pessoa. "Irene Lopes" contém "enel" no meio e não pode virar conta de luz.',
      transacoes: serie(hoje, 'PIX TRANSF IRENE LOPES', [-300], [[3, 1], [2, 1], [1, 1], [0, 1]], 'Transfer'),
    },
    {
      nome: 'iFood',
      esperado: 'eventual',
      motivo: 'Valores e datas irregulares.',
      transacoes: serie(hoje, 'IFOOD', [-32.5, -88.9, -19, -64.3, -41.7], [[2, 3], [1, 20], [1, 2], [0, 14], [0, 1]], 'Food'),
    },
    {
      nome: 'Uber',
      esperado: 'eventual',
      motivo: 'Várias corridas por mês com valores diferentes.',
      transacoes: serie(hoje, 'UBER TRIP', [-14.2, -27.8, -9.5, -41], [[1, 25], [1, 11], [0, 17], [0, 3]], 'Transport'),
    },
    {
      nome: 'Roblox (compras avulsas)',
      esperado: 'eventual',
      motivo: 'Mesmo nome, sem ciclo.',
      transacoes: serie(hoje, 'DL ROBLOX', [-25, -50, -25], [[2, 9], [1, 26], [0, 17]], 'Games'),
    },
    {
      nome: 'Magazine Luiza 3/10',
      esperado: 'eventual',
      motivo: 'Parcela de compra não é assinatura.',
      transacoes: [
        { description: 'MAGAZINE LUIZA 1/10', amount: 129.9, date: dataRelativa(hoje, 2, 15), category: 'Shopping', tipoConta: 'CREDIT' },
        { description: 'MAGAZINE LUIZA 2/10', amount: 129.9, date: dataRelativa(hoje, 1, 15), category: 'Shopping', tipoConta: 'CREDIT' },
        { description: 'MAGAZINE LUIZA 3/10', amount: 129.9, date: dataRelativa(hoje, 0, 15), category: 'Shopping', tipoConta: 'CREDIT' },
      ],
    },
    {
      nome: 'Pagamento da fatura',
      esperado: 'eventual',
      motivo: 'Movimento entre contas, não assinatura.',
      transacoes: serie(hoje, 'PAGAMENTO FATURA CARTAO', [-812.4, -640.1, -955.3], [[2, 0], [1, 0], [0, 0]], 'Credit card payment'),
    },
  ];
}

export interface LinhaSandbox {
  nome: string;
  esperado: EsperadoSandbox;
  obtido: EsperadoSandbox;
  acertou: boolean;
  motivo: string;
  periodicidade: Periodicidade | null;
  ultimaCobranca: string | null;
  proximaCobranca: string | null;
  pago: boolean | null;
}

/** Roda a heurística no extrato de teste inteiro e compara cada cenário com o esperado. */
export function avaliarSandbox(hoje = hojeIso()) {
  const cenarios = cenariosSandbox(hoje);
  const detectadas = identificarRecorrencias(extratoSandbox(hoje), hoje);
  const porChave = new Map(detectadas.map((item) => [item.chave, item]));

  const linhas: LinhaSandbox[] = cenarios.map((cenario) => {
    const chave = chaveDescricao(cenario.transacoes[0]?.description ?? cenario.nome);
    const item = porChave.get(chave);
    const obtido: EsperadoSandbox =
      !item || item.classificacao === 'eventual' ? 'eventual' : item.situacao;

    return {
      nome: cenario.nome,
      esperado: cenario.esperado,
      obtido,
      acertou: obtido === cenario.esperado,
      motivo: cenario.motivo,
      periodicidade: item?.periodicidade ?? null,
      ultimaCobranca: item?.ultimaCobranca ?? null,
      proximaCobranca: obtido === 'eventual' ? null : item?.proximaCobranca ?? null,
      pago: obtido === 'eventual' ? null : item?.pago ?? null,
    };
  });

  return {
    hoje,
    totalCenarios: linhas.length,
    acertos: linhas.filter((linha) => linha.acertou).length,
    linhas,
  };
}

export function extratoSandbox(hoje = hojeIso()): TransacaoAnalise[] {
  const transacoes = cenariosSandbox(hoje).flatMap((cenario) => cenario.transacoes);

  transacoes.push(
    { description: 'SALARIO EMPRESA X', amount: 4200, date: dataRelativa(hoje, 1, 0), category: 'Salary' },
    { description: 'SALARIO EMPRESA X', amount: 4200, date: dataRelativa(hoje, 0, 0), category: 'Salary' },
  );

  return transacoes;
}
