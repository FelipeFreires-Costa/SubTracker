import { useEffect, useMemo, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { FaCalendarDay, FaChartPie, FaExclamationCircle, FaWallet } from 'react-icons/fa';
import type { Conta, ConexaoPluggyStatus } from '../types/Conta';
import { contaService } from '../services/contaService';
import { pluggyService } from '../services/pluggyService';
import { iconeDaConta } from '../utils/categoriaIcones';
import {
  custoAnual,
  custoMensal,
  dataDeAlerta,
  diasRestantes,
  ehParcela,
  formatarData,
  formatarDinheiro,
  formatarPercentual,
  historicoGasto,
  nomeParaExibicao,
  proximasCobrancas,
  resumoDeGastos,
  rotuloCategoria,
  rotuloPeriodicidade,
  totalJaGasto,
  verificarSituacao,
} from '../utils/contaHelpers';
import './Relatorio.css';

const CORES = ['#5a7d9a', '#9b8ab8', '#3d7a75', '#c4a35a', '#6b8e6b', '#4a6880'];

/** Só para demo da banca: VITE_MOSTRAR_AVALIACAO=true. Usuário final não vê. */
const MOSTRAR_AVALIACAO = import.meta.env.VITE_MOSTRAR_AVALIACAO === 'true';

const ESTILO_TOOLTIP = {
  background: '#121212',
  border: '1px solid #222222',
  borderRadius: '3px',
  color: '#eef1f6',
};

const ESTILO_TOOLTIP_ITEM = { color: '#eef1f6' };
const ESTILO_TOOLTIP_LABEL = { color: '#c8cdd6' };

function rotuloDiaCurto(iso: string) {
  const data = new Date(`${iso}T00:00:00`);
  return data.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }).replace('.', '');
}

export function Relatorio() {
  const [contas, setContas] = useState<Conta[]>([]);
  const [conexao, setConexao] = useState<ConexaoPluggyStatus | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [mostrarTodas, setMostrarTodas] = useState(false);

  useEffect(() => {
    async function carregarDados() {
      try {
        setContas(await contaService.listar());
      } catch {
        setErro('Não foi possível carregar o relatório.');
      } finally {
        setCarregando(false);
      }

      try {
        setConexao(await pluggyService.statusConexao());
      } catch {
        setConexao(null);
      }
    }

    carregarDados();
  }, []);

  const assinaturas = useMemo(() => contas.filter((conta) => !ehParcela(conta)), [contas]);
  const gastos = useMemo(() => resumoDeGastos(assinaturas), [assinaturas]);
  const jaGasto = useMemo(() => totalJaGasto(assinaturas), [assinaturas]);
  const temEstimado = useMemo(
    () => assinaturas.some((conta) => historicoGasto(conta).estimado),
    [assinaturas],
  );
  const ranking = useMemo(
    () => [...assinaturas].sort((a, b) => custoMensal(b) - custoMensal(a)),
    [assinaturas],
  );
  const rankingVisivel = mostrarTodas ? ranking : ranking.slice(0, 5);
  const maior = ranking[0];

  const proximas7 = useMemo(() => proximasCobrancas(assinaturas, 7), [assinaturas]);
  const proximas30 = useMemo(() => proximasCobrancas(assinaturas, 30), [assinaturas]);
  const proximasLista = useMemo(() => proximas30.slice(0, 8), [proximas30]);
  const totalProximas7 = useMemo(
    () => proximas7.reduce((soma, conta) => soma + Number(conta.preco), 0),
    [proximas7],
  );
  const totalProximas30 = useMemo(
    () => proximas30.reduce((soma, conta) => soma + Number(conta.preco), 0),
    [proximas30],
  );

  const atrasadas = useMemo(
    () =>
      assinaturas.filter((conta) => {
        if (conta.pago) return false;
        return verificarSituacao(dataDeAlerta(conta)) === 'vencida';
      }),
    [assinaturas],
  );

  const vencemHoje = useMemo(
    () =>
      assinaturas.filter((conta) => verificarSituacao(dataDeAlerta(conta)) === 'hoje'),
    [assinaturas],
  );

  const agenda7 = useMemo(() => {
    const mapa = new Map<string, Conta[]>();
    for (const conta of proximas7) {
      const chave = dataDeAlerta(conta);
      const lista = mapa.get(chave) ?? [];
      lista.push(conta);
      mapa.set(chave, lista);
    }
    return [...mapa.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [proximas7]);

  const dadosPizza = useMemo(() => {
    const porCategoria = assinaturas.reduce<Record<string, number>>((acumulador, conta) => {
      const categoria = conta.categoria || 'Outros';
      acumulador[categoria] = (acumulador[categoria] ?? 0) + custoMensal(conta);
      return acumulador;
    }, {});

    return Object.entries(porCategoria)
      .map(([categoria, value]) => ({
        categoria,
        name: rotuloCategoria(categoria),
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [assinaturas]);

  const respostaHoje =
    atrasadas.length > 0
      ? `${atrasadas.length} atrasada${atrasadas.length > 1 ? 's' : ''}`
      : vencemHoje.length > 0
        ? `${vencemHoje.length} vence${vencemHoje.length > 1 ? 'm' : ''} hoje`
        : proximas7.length > 0
          ? `${proximas7.length} nos próximos 7 dias`
          : 'Nada urgente hoje';

  return (
    <div className="relatorio-pagina">
      <header className="relatorio-cabecalho">
        <h1>Relatório</h1>
        <p>Respostas rápidas sobre o que você paga, o que vence agora e o que mais pesa.</p>
      </header>

      {carregando && <p>Carregando...</p>}
      {erro && <p className="relatorio-erro">{erro}</p>}

      <section className="relatorio-perguntas" aria-label="Perguntas rápidas">
        <article className={`relatorio-pergunta ${atrasadas.length > 0 ? 'alerta' : 'ok'}`}>
          <div className="relatorio-pergunta-topo">
            <FaExclamationCircle size={14} aria-hidden="true" />
            <span>E hoje?</span>
          </div>
          <strong>{respostaHoje}</strong>
          <em>
            {atrasadas.length > 0
              ? `Total atrasado: ${formatarDinheiro(
                  atrasadas.reduce((s, c) => s + Number(c.preco), 0),
                )}`
              : vencemHoje.length > 0
                ? formatarDinheiro(vencemHoje.reduce((s, c) => s + Number(c.preco), 0))
                : 'Sem cobrança marcada para hoje'}
          </em>
        </article>

        <article className="relatorio-pergunta destaque">
          <div className="relatorio-pergunta-topo">
            <FaWallet size={14} aria-hidden="true" />
            <span>Quanto sai por mês?</span>
          </div>
          <strong>{formatarDinheiro(gastos.porMes)}</strong>
          <em>
            {assinaturas.length} recorrentes · {formatarDinheiro(gastos.porAno)}/ano
          </em>
        </article>

        <article className="relatorio-pergunta">
          <div className="relatorio-pergunta-topo">
            <FaCalendarDay size={14} aria-hidden="true" />
            <span>E nos próximos 7 dias?</span>
          </div>
          <strong>{formatarDinheiro(totalProximas7)}</strong>
          <em>
            {proximas7.length === 0
              ? 'Nenhuma cobrança na semana'
              : `${proximas7.length} cobrança${proximas7.length > 1 ? 's' : ''}`}
          </em>
        </article>

        <article className="relatorio-pergunta">
          <div className="relatorio-pergunta-topo">
            <FaChartPie size={14} aria-hidden="true" />
            <span>O que mais pesa?</span>
          </div>
          <strong>{maior ? formatarDinheiro(custoMensal(maior)) : '—'}</strong>
          <em>{maior ? nomeParaExibicao(maior.nome) : 'Sem dados ainda'}</em>
        </article>
      </section>

      <section className="relatorio-card relatorio-hoje">
        <div className="relatorio-card-topo">
          <div>
            <h2>Nos próximos dias</h2>
            <p className="relatorio-card-sub">Agenda das cobranças dos próximos 7 dias</p>
          </div>
          <span className="relatorio-proximas-total">{formatarDinheiro(totalProximas7)}</span>
        </div>

        {agenda7.length === 0 ? (
          <p className="relatorio-vazio">Nenhuma cobrança nos próximos 7 dias.</p>
        ) : (
          <div className="relatorio-agenda">
            {agenda7.map(([dia, itens]) => {
              const situacao = verificarSituacao(dia);
              return (
                <article
                  key={dia}
                  className={`relatorio-agenda-dia ${situacao === 'vencida' ? 'atrasada' : ''} ${
                    situacao === 'hoje' ? 'hoje' : ''
                  }`}
                >
                  <header>
                    <strong>{situacao === 'hoje' ? 'Hoje' : rotuloDiaCurto(dia)}</strong>
                    <span>{formatarData(dia)}</span>
                  </header>
                  <ul>
                    {itens.map((conta) => (
                      <li key={conta.id}>
                        <span className="relatorio-item-icone" aria-hidden="true">
                          {iconeDaConta(conta.categoria, conta.nome, 16)}
                        </span>
                        <div>
                          <strong>{nomeParaExibicao(conta.nome)}</strong>
                          <span>
                            {situacao === 'vencida'
                              ? 'Atrasada'
                              : situacao === 'hoje'
                                ? 'Vence hoje'
                                : diasRestantes(dia) || 'Na agenda'}
                          </span>
                        </div>
                        <em>{formatarDinheiro(Number(conta.preco))}</em>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <div className="relatorio-grade">
        <section className="relatorio-card">
          <h2>Para onde vai o dinheiro?</h2>
          <p className="relatorio-card-sub">Composição mensal por categoria</p>
          {dadosPizza.length === 0 ? (
            <p className="relatorio-vazio">Nenhuma assinatura ainda.</p>
          ) : (
            <>
              <div className="relatorio-pizza">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={dadosPizza}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={78}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {dadosPizza.map((fatia, index) => (
                        <Cell key={fatia.categoria} fill={CORES[index % CORES.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [
                        `${formatarDinheiro(Number(value))}/mês`,
                        String(name),
                      ]}
                      contentStyle={ESTILO_TOOLTIP}
                      itemStyle={ESTILO_TOOLTIP_ITEM}
                      labelStyle={ESTILO_TOOLTIP_LABEL}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="relatorio-legendas">
                {dadosPizza.slice(0, 6).map((fatia, index) => (
                  <li key={fatia.categoria}>
                    <span className="relatorio-legenda-nome">
                      <i style={{ background: CORES[index % CORES.length] }} />
                      <span className="relatorio-legenda-icone" aria-hidden="true">
                        {iconeDaConta(fatia.categoria, fatia.categoria, 18)}
                      </span>
                      {fatia.name}
                    </span>
                    <em>
                      {formatarDinheiro(fatia.value)}
                      <small>{formatarPercentual(fatia.value, gastos.porMes)}</small>
                    </em>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className="relatorio-card">
          <div className="relatorio-card-topo">
            <div>
              <h2>Quem mais pesa no mês?</h2>
              <p className="relatorio-card-sub">Ranking pelo custo mensal estimado</p>
            </div>
            {ranking.length > 5 && (
              <button
                type="button"
                className="relatorio-link"
                onClick={() => setMostrarTodas((aberto) => !aberto)}
              >
                {mostrarTodas ? 'Ver menos' : 'Ver todas'}
              </button>
            )}
          </div>
          {ranking.length === 0 ? (
            <p className="relatorio-vazio">Nenhuma assinatura ainda.</p>
          ) : (
            <ul className="relatorio-lista relatorio-ranking">
              {rankingVisivel.map((conta, indice) => {
                const mensal = custoMensal(conta);
                const largura = gastos.porMes > 0 ? (mensal / gastos.porMes) * 100 : 0;
                const hist = historicoGasto(conta);

                return (
                  <li key={conta.id}>
                    <div className="relatorio-ranking-topo">
                      <div className="relatorio-ranking-nome">
                        <span className="relatorio-rank-pos">{indice + 1}</span>
                        <span className="relatorio-item-icone" aria-hidden="true">
                          {iconeDaConta(conta.categoria, conta.nome, 14)}
                        </span>
                        <div>
                          <strong>{nomeParaExibicao(conta.nome)}</strong>
                          <span>
                            {rotuloPeriodicidade(conta.periodicidade)}
                            {' · '}
                            {formatarDinheiro(custoAnual(conta))}/ano
                            {' · '}
                            {formatarDinheiro(hist.total)} já cobrado
                            {hist.estimado ? ' (est.)' : ''}
                          </span>
                        </div>
                      </div>
                      <em>
                        {formatarDinheiro(mensal)}/mês
                        <small>{formatarPercentual(mensal, gastos.porMes)}</small>
                      </em>
                    </div>
                    <div className="relatorio-barra" aria-hidden="true">
                      <div style={{ width: `${Math.max(largura, 2)}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <section className="relatorio-card relatorio-proximas">
        <div className="relatorio-card-topo">
          <div>
            <h2>O que vem nos próximos 30 dias?</h2>
            <p className="relatorio-card-sub">
              Já saiu {formatarDinheiro(jaGasto)}
              {temEstimado ? ' (extrato + estimado)' : ' no histórico'}
            </p>
          </div>
          {proximasLista.length > 0 && (
            <span className="relatorio-proximas-total">{formatarDinheiro(totalProximas30)}</span>
          )}
        </div>
        {proximasLista.length === 0 ? (
          <p className="relatorio-vazio">Nenhuma cobrança prevista nos próximos 30 dias.</p>
        ) : (
          <ul className="relatorio-lista relatorio-proximos-lista">
            {proximasLista.map((conta) => {
              const vencimento = dataDeAlerta(conta);
              const situacao = verificarSituacao(vencimento);
              const atrasada = !conta.pago && situacao === 'vencida';

              return (
                <li key={conta.id}>
                  <div className="relatorio-ranking-nome">
                    <span className="relatorio-item-icone" aria-hidden="true">
                      {iconeDaConta(conta.categoria, conta.nome, 14)}
                    </span>
                    <div>
                      <strong>{nomeParaExibicao(conta.nome)}</strong>
                      <span className={atrasada ? 'relatorio-atrasada' : ''}>
                        {atrasada
                          ? `Atrasada · ${formatarData(vencimento)}`
                          : situacao === 'hoje'
                            ? `Hoje · ${formatarData(vencimento)}`
                            : `${formatarData(vencimento)} · ${diasRestantes(vencimento)}`}
                      </span>
                    </div>
                  </div>
                  <em>{formatarDinheiro(Number(conta.preco))}</em>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {conexao?.conectado && (
        <p className="relatorio-nota">
          Banco conectado
          {conexao.ultimaSincronizacao
            ? ` · atualizado em ${new Date(conexao.ultimaSincronizacao).toLocaleDateString('pt-BR')}`
            : ''}
          {conexao.recorrentesEncontradas != null
            ? ` · ${conexao.recorrentesEncontradas} recorrentes`
            : ''}
          . Extrato bruto não é guardado.
        </p>
      )}

      {MOSTRAR_AVALIACAO && (
        <p className="relatorio-nota">
          Avaliação acadêmica disponível via API (`/heuristica/avaliacao`) e scripts do backend —
          não exibida nesta tela de uso.
        </p>
      )}
    </div>
  );
}
