import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import CardsContas from '../Components/CardsContas/CardsContas';
import { PluggyConnect } from 'react-pluggy-connect';
import {
  FaCalendarAlt,
  FaLightbulb,
  FaSearch,
  FaSyncAlt,
} from 'react-icons/fa';
import { HiOutlineTrendingDown } from 'react-icons/hi';
import { ModalConfirmacao } from '../Components/ModalConfirmacao/ModalConfirmacao';
import { ModalConta } from '../Components/ModalConta/ModalConta';
import { ModalDrenos } from '../Components/ModalDrenos/ModalDrenos';
import { useContas } from '../hooks/useContas';
import { pluggyService } from '../services/pluggyService';
import { iconeDaConta } from '../utils/categoriaIcones';
import {
  resumoDeGastos,
  dataDeAlerta,
  diasRestantes,
  formatarData,
  formatarDiaMes,
  formatarDinheiro,
  formatarPercentual,
  proximaContaAberta,
  proximasCobrancas,
  resumoAlertas,
  rotuloPeriodicidade,
  verificarSituacao,
  ehParcela,
  nomeParaExibicao,
  contaEstaPaga,
  agruparPorMes,
  custoMensal,
  maioresDrenos,
  textoHistoricoGasto,
  totalJaGasto,
  serieGastoMensal,
} from '../utils/contaHelpers';
import './Home.css';

const MODO_SANDBOX = import.meta.env.VITE_PLUGGY_SANDBOX !== 'false';

export function Home() {
  const {
    contas,
    carregando,
    erro,
    notificacao,
    criarConta,
    atualizarConta,
    alternarStatus,
    removerConta,
    importarDaPluggy,
    tratarErro,
    conexao,
    sincronizarPluggy,
    importarSandbox,
    desconectarPluggy,
  } = useContas();

  const [connectToken, setConnectToken] = useState<string | null>(null);
  const [contaParaApagar, setContaParaApagar] = useState<number | null>(null);
  const [modalContaAberto, setModalContaAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [nomeInput, setNomeInput] = useState('');
  const [precoInput, setPrecoInput] = useState('');
  const [dataInput, setDataInput] = useState('');
  const [categoriaInput, setCategoriaInput] = useState('');
  const [cicloInput, setCicloInput] = useState('mensal');

  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<'todos' | 'pagar' | 'pagas'>('todos');
  const [baixandoExtrato, setBaixandoExtrato] = useState(false);
  const [atualizandoBanco, setAtualizandoBanco] = useState(false);
  const [avisoBanco, setAvisoBanco] = useState<string | null>(null);
  const [modalDrenosAberto, setModalDrenosAberto] = useState(false);
  const [modoSerie, setModoSerie] = useState<'mensal' | 'anual'>('mensal');

  const listaContas = useMemo(
    () => contas.filter((conta) => !ehParcela(conta)),
    [contas],
  );
  const gastos = useMemo(() => resumoDeGastos(listaContas), [listaContas]);
  const jaGasto = useMemo(() => totalJaGasto(listaContas), [listaContas]);
  const drenos = useMemo(() => maioresDrenos(listaContas, 3), [listaContas]);
  const proximas30 = useMemo(() => proximasCobrancas(listaContas, 30), [listaContas]);
  const proximas = useMemo(() => proximas30.slice(0, 5), [proximas30]);
  const serieMensal = useMemo(() => serieGastoMensal(listaContas, 12), [listaContas]);
  const serieGrafico = useMemo(() => {
    if (modoSerie === 'mensal') return serieMensal;
    const anual = serieMensal.reduce((soma, ponto) => soma + ponto.total, 0);
    return [{ chave: 'ano', rotulo: '12 meses', total: Number(anual.toFixed(2)) }];
  }, [modoSerie, serieMensal]);
  const ativas = useMemo(
    () => listaContas.filter((conta) => conta.situacao !== 'encerrada').length,
    [listaContas],
  );

  const contasVisiveis = useMemo(() => {
    const texto = busca.trim().toLowerCase();

    const filtradas = listaContas.filter((conta) => {
      const paga = contaEstaPaga(conta);
      if (filtro === 'pagar' && paga) return false;
      if (filtro === 'pagas' && !paga) return false;
      if (!texto) return true;
      return (
        conta.nome.toLowerCase().includes(texto) ||
        nomeParaExibicao(conta.nome).toLowerCase().includes(texto) ||
        (conta.categoria || '').toLowerCase().includes(texto)
      );
    });

    return [...filtradas].sort((a, b) => {
      const pagaA = contaEstaPaga(a);
      const pagaB = contaEstaPaga(b);
      if (pagaA !== pagaB) return pagaA ? 1 : -1;
      return dataDeAlerta(a).localeCompare(dataDeAlerta(b));
    });
  }, [listaContas, busca, filtro]);

  const gruposMes = useMemo(() => agruparPorMes(contasVisiveis), [contasVisiveis]);

  const proxima = useMemo(() => proximaContaAberta(listaContas), [listaContas]);
  const alertas = useMemo(() => resumoAlertas(listaContas), [listaContas]);

  function limparFormulario() {
    setNomeInput('');
    setPrecoInput('');
    setDataInput('');
    setCategoriaInput('');
    setCicloInput('mensal');
    setEditandoId(null);
    setModalContaAberto(false);
  }

  function abrirNovaConta() {
    setNomeInput('');
    setPrecoInput('');
    setDataInput('');
    setCategoriaInput('');
    setCicloInput('mensal');
    setEditandoId(null);
    setModalContaAberto(true);
  }

  function validarFormulario() {
    if (!nomeInput || !precoInput || !dataInput) {
      alert('Preencha nome, valor e vencimento.');
      return false;
    }
    return true;
  }

  async function abrirWidget() {
    try {
      setAvisoBanco(null);
      const dados = await pluggyService.obterConnectToken();
      setConnectToken(dados.accessToken);
    } catch (error) {
      tratarErro(error, 'Não foi possível abrir a conexão com o banco.');
      setAvisoBanco(
        'Não foi possível abrir a conexão agora. Espere um instante e tente de novo.',
      );
    }
  }

  async function atualizarDoBanco() {
    try {
      setAtualizandoBanco(true);
      setAvisoBanco(null);
      await sincronizarPluggy();
    } catch (error) {
      tratarErro(error, 'Não deu para atualizar as assinaturas.');
      setAvisoBanco(
        'Não deu para atualizar com a conexão atual. Use “Reconectar banco” para entrar de novo no Open Finance.',
      );
    } finally {
      setAtualizandoBanco(false);
    }
  }

  async function carregarCenariosTeste() {
    try {
      await importarSandbox();
    } catch (error) {
      tratarErro(error, 'Não deu para carregar os cenários de teste.');
      alert('Não deu para carregar os cenários de teste.');
    }
  }

  async function baixarExtrato() {
    if (!conexao.conectado) {
      alert('Conecte o banco primeiro para baixar o extrato.');
      return;
    }

    try {
      setBaixandoExtrato(true);
      await pluggyService.baixarExtrato();
    } catch (error) {
      tratarErro(error, 'Não deu para baixar o extrato.');
      alert('Não deu para baixar o extrato. Conecte o banco e tente de novo.');
    } finally {
      setBaixandoExtrato(false);
    }
  }

  async function desconectarBanco() {
    try {
      await desconectarPluggy();
    } catch (error) {
      tratarErro(error, 'Não deu para desconectar o banco.');
      alert('Não deu para desconectar o banco.');
    }
  }

  function dataUltimaSincronizacao(): Date | null {
    if (!conexao.ultimaSincronizacao) return null;
    const data = new Date(conexao.ultimaSincronizacao);
    return Number.isNaN(data.getTime()) ? null : data;
  }

  function textoUltimaSincronizacao() {
    const data = dataUltimaSincronizacao();
    if (!data) return '';
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function diasDesdeSincronizacao(): number | null {
    const data = dataUltimaSincronizacao();
    if (!data) return null;
    return Math.floor((Date.now() - data.getTime()) / (24 * 60 * 60 * 1000));
  }

  function sincronizacaoAntiga(): boolean {
    if (!conexao.conectado) return false;
    const dias = diasDesdeSincronizacao();
    return dias !== null && dias >= 7;
  }

  function textoIdadeSincronizacao(): string {
    const dias = diasDesdeSincronizacao();
    if (dias === null) return '';
    if (dias <= 0) return 'hoje';
    if (dias === 1) return 'há 1 dia';
    return `há ${dias} dias`;
  }

  async function sucessoAoConectar(itemData: { item: { id: string } }) {
    try {
      setAvisoBanco(null);
      await importarDaPluggy(itemData.item.id);
      setConnectToken(null);
    } catch (error) {
      console.error('Erro ao importar assinaturas:', error);
      setConnectToken(null);
      setAvisoBanco(
        'O banco conectou, mas as assinaturas não vieram. Toque em “Buscar cobranças novas”.',
      );
    }
  }

  async function confirmarRemocao() {
    if (contaParaApagar === null) return;

    try {
      await removerConta(contaParaApagar);
    } catch (error) {
      tratarErro(error, 'Não deu para excluir a conta.');
      alert('Não deu para excluir a conta. Tente de novo.');
    } finally {
      setContaParaApagar(null);
    }
  }

  async function adicionarConta() {
    if (!validarFormulario()) return;

    try {
      await criarConta({
        nome: nomeInput,
        preco: Number(precoInput),
        data: dataInput,
        pago: false,
        categoria: categoriaInput || 'Outros',
        periodicidade: cicloInput as 'mensal' | 'bimestral' | 'anual',
      });
      limparFormulario();
    } catch (error) {
      tratarErro(error, 'Não deu para salvar a conta.');
      alert('Não deu para salvar a conta. Tente de novo.');
    }
  }

  async function salvarEdicao() {
    if (!validarFormulario() || editandoId === null) return;

    try {
      await atualizarConta(editandoId, {
        nome: nomeInput,
        preco: Number(precoInput),
        data: dataInput,
        categoria: categoriaInput || 'Outros',
        periodicidade: cicloInput as 'mensal' | 'bimestral' | 'anual',
      });
      limparFormulario();
    } catch (error) {
      tratarErro(error, 'Não deu para salvar as alterações.');
      alert('Não deu para salvar as alterações. Tente de novo.');
    }
  }

  async function handleAlternarStatus(id: number) {
    try {
      await alternarStatus(id);
    } catch (error) {
      tratarErro(error, 'Não deu para marcar como paga.');
      alert('Não deu para marcar como paga. Tente de novo.');
    }
  }

  function prepararEdicao(conta: (typeof contas)[number]) {
    setNomeInput(nomeParaExibicao(conta.nome));
    setPrecoInput(conta.preco.toString());
    setDataInput(conta.data);
    setCategoriaInput(conta.categoria);
    setCicloInput(
      conta.periodicidade === 'bimestral' || conta.periodicidade === 'anual'
        ? conta.periodicidade
        : 'mensal',
    );
    setEditandoId(conta.id);
    setModalContaAberto(true);
  }

  async function salvarConta() {
    if (editandoId !== null) {
      await salvarEdicao();
      return;
    }
    await adicionarConta();
  }

  return (
    <div className="home-content">
      <main className="main-content">
        <header className="home-cabecalho">
          <h1>Visão geral</h1>
          <p>O que sai todo mês, o que vence em breve e o histórico dos últimos meses.</p>
        </header>

        <div className="home-dashboard">
          <section className="home-kpi-grid" aria-label="Resumo">
            <article className="home-kpi destaque">
              <div className="home-kpi-topo">
                <span>
                  <HiOutlineTrendingDown size={14} aria-hidden="true" />
                  Total em assinaturas
                </span>
                <button
                  type="button"
                  className="linkish"
                  onClick={() => setModalDrenosAberto(true)}
                  style={{ background: 'none', border: 'none', color: 'var(--agua)', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem' }}
                >
                  Ver drenos
                </button>
              </div>
              <strong>{formatarDinheiro(gastos.porMes)}</strong>
              <em>/mês · {formatarDinheiro(jaGasto)} já saiu no histórico</em>
            </article>

            <article className="home-kpi ok">
              <div className="home-kpi-topo">
                <span>
                  <FaSyncAlt size={13} aria-hidden="true" />
                  Assinaturas ativas
                </span>
              </div>
              <strong>
                {ativas}
                <span style={{ fontSize: '1rem', color: 'var(--tinta-fraca)', fontWeight: 600 }}>
                  {' '}
                  de {listaContas.length}
                </span>
              </strong>
              <em>cadastradas neste espaço</em>
            </article>

            <article className={`home-kpi ${gastos.aPagarNoMes > 0 ? 'alerta' : 'ok'}`}>
              <div className="home-kpi-topo">
                <span>
                  <FaCalendarAlt size={13} aria-hidden="true" />
                  Próximo vencimento
                </span>
              </div>
              {proxima ? (
                <>
                  <strong>{formatarDiaMes(dataDeAlerta(proxima))}</strong>
                  <em>
                    {nomeParaExibicao(proxima.nome)} · {formatarDinheiro(Number(proxima.preco))}
                  </em>
                </>
              ) : (
                <>
                  <strong>Em dia</strong>
                  <em>nada em aberto neste mês</em>
                </>
              )}
            </article>
          </section>

          <section className="home-painel-grade">
            <article className="home-painel">
              <div className="home-painel-topo">
                <h2>Seu gasto ao longo do tempo</h2>
                <div className="home-modo-serie" role="group" aria-label="Período do gráfico">
                  <button
                    type="button"
                    className={modoSerie === 'mensal' ? 'ativo' : ''}
                    onClick={() => setModoSerie('mensal')}
                  >
                    Mensal
                  </button>
                  <button
                    type="button"
                    className={modoSerie === 'anual' ? 'ativo' : ''}
                    onClick={() => setModoSerie('anual')}
                  >
                    Anual
                  </button>
                </div>
              </div>
              {serieGrafico.some((p) => p.total > 0) ? (
                <div className="home-grafico">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={serieGrafico} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <XAxis
                        dataKey="rotulo"
                        tick={{ fill: '#8a8a8a', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: '#8a8a8a', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        width={48}
                        tickFormatter={(v) => `R$${Math.round(Number(v))}`}
                      />
                      <Tooltip
                        formatter={(valor) => [formatarDinheiro(Number(valor)), 'Gasto']}
                        contentStyle={{
                          background: '#121212',
                          border: '1px solid #222',
                          borderRadius: 3,
                          color: '#f2f2f2',
                        }}
                      />
                      <Bar dataKey="total" fill="#5a7d9a" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="home-vazio-painel">
                  Adicione ou importe contas para ver o histórico dos meses.
                </p>
              )}
            </article>

            <article className="home-painel">
              <div className="home-painel-topo">
                <h2>Próximos vencimentos</h2>
                <button type="button" className="linkish" onClick={() => setFiltro('pagar')}>
                  Ver todas
                </button>
              </div>
              {proximas.length === 0 ? (
                <p className="home-vazio-painel">Nenhuma cobrança nos próximos 30 dias.</p>
              ) : (
                <ul className="home-proximos">
                  {proximas.map((conta) => {
                    const vencimento = dataDeAlerta(conta);
                    const atrasada = !conta.pago && verificarSituacao(vencimento) === 'vencida';
                    return (
                      <li key={conta.id}>
                        <span className="home-prox-icone" aria-hidden="true">
                          {iconeDaConta(conta.categoria, conta.nome, 15)}
                        </span>
                        <div className="home-prox-info">
                          <strong>{nomeParaExibicao(conta.nome)}</strong>
                          <span className={atrasada ? 'atrasada' : ''}>
                            {atrasada
                              ? `Atrasada · ${formatarData(vencimento)}`
                              : formatarData(vencimento)}
                          </span>
                        </div>
                        <span className="home-prox-valor">
                          {formatarDinheiro(Number(conta.preco))}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </article>
          </section>

          {proximas30.length > 0 && (
            <aside className="home-alerta-faixa" role="status">
              <p>
                <FaLightbulb size={14} aria-hidden="true" style={{ marginRight: 8 }} />
                Você tem {proximas30.length} vencimento
                {proximas30.length === 1 ? '' : 's'} nos próximos 30 dias
                {alertas.atrasadas > 0
                  ? ` · ${alertas.atrasadas} atrasada${alertas.atrasadas === 1 ? '' : 's'}`
                  : ''}
                . Mantenha as contas em dia.
              </p>
              <button type="button" onClick={() => setFiltro('pagar')}>
                Ver detalhes
              </button>
            </aside>
          )}

          {drenos.length > 0 && (
            <button
              type="button"
              className="drenos-atalho"
              onClick={() => setModalDrenosAberto(true)}
              aria-haspopup="dialog"
            >
              <span className="drenos-atalho-icone" aria-hidden="true">
                <HiOutlineTrendingDown size={22} />
              </span>
              <span className="drenos-atalho-texto">
                <strong>O que drena</strong>
                <small>ranking e histórico por assinatura</small>
              </span>
              <span className="drenos-atalho-preview" aria-hidden="true">
                {drenos.map((conta) => {
                  const mensal = custoMensal(conta);
                  const pct = gastos.porMes > 0 ? (mensal / gastos.porMes) * 100 : 0;
                  return (
                    <span key={conta.id} className="drenos-mini">
                      <span className="drenos-mini-nome">{nomeParaExibicao(conta.nome)}</span>
                      <span className="drenos-mini-barra">
                        <i style={{ width: `${Math.max(pct, 8)}%` }} />
                      </span>
                      <span className="drenos-mini-pct">
                        {formatarPercentual(mensal, gastos.porMes)}
                      </span>
                    </span>
                  );
                })}
              </span>
            </button>
          )}
        </div>

        <div className="acoes-contas home-acoes-compactas">
          <button className="btn-nova-conta" onClick={abrirNovaConta}>
            Adicionar
          </button>
          {connectToken ? (
            <button type="button" className="pluggy-secundario" onClick={() => setConnectToken(null)}>
              Fechar conexão
            </button>
          ) : (
            <>
              {conexao.conectado && (
                <button type="button" onClick={atualizarDoBanco} disabled={atualizandoBanco}>
                  {atualizandoBanco ? 'Buscando...' : 'Buscar cobranças novas'}
                </button>
              )}
              <button type="button" onClick={abrirWidget} disabled={atualizandoBanco}>
                {conexao.conectado ? 'Reconectar banco' : 'Conectar banco'}
              </button>
              {conexao.exportarExtratoAtivo && (
                <button
                  type="button"
                  className="pluggy-secundario"
                  onClick={baixarExtrato}
                  disabled={!conexao.conectado || baixandoExtrato}
                >
                  {baixandoExtrato ? 'Baixando...' : 'Baixar extrato'}
                </button>
              )}
              {conexao.conectado && (
                <button type="button" className="pluggy-secundario" onClick={desconectarBanco}>
                  Desconectar
                </button>
              )}
              {MODO_SANDBOX && (
                <button type="button" className="pluggy-secundario" onClick={carregarCenariosTeste}>
                  Gerador local (não é Pluggy)
                </button>
              )}
            </>
          )}
          {!connectToken && conexao.conectado && conexao.ultimaSincronizacao && (
            <span className="acao-nota">
              Atualizado {textoIdadeSincronizacao()} ({textoUltimaSincronizacao()})
            </span>
          )}
        </div>

        {(sincronizacaoAntiga() || avisoBanco) && !connectToken && (
          <div className="aviso-sync" role="status">
            <p>
              {avisoBanco
                ? avisoBanco
                : `Os dados do banco estão desatualizados (${textoIdadeSincronizacao()}, em ${textoUltimaSincronizacao()}). Busque cobranças novas. Se o banco pedir senha de novo, reconecte.`}
            </p>
            <div className="aviso-sync-acoes">
              {conexao.conectado && (
                <button type="button" onClick={atualizarDoBanco} disabled={atualizandoBanco}>
                  {atualizandoBanco ? 'Buscando...' : '1. Buscar cobranças novas'}
                </button>
              )}
              <button
                type="button"
                className="aviso-sync-secundario"
                onClick={abrirWidget}
                disabled={atualizandoBanco}
              >
                {conexao.conectado ? '2. Reconectar banco' : 'Conectar banco'}
              </button>
            </div>
          </div>
        )}

        {connectToken && (
          <div className="pluggy-widget-box">
            <p className="aviso-sync" role="status">
              Entre na instituição pelo painel abaixo. Se cancelar ou fechar, use “Fechar conexão”
              para voltar às suas contas.
            </p>
            <div className="pluggy-widget">
              <PluggyConnect
                connectToken={connectToken}
                includeSandbox={MODO_SANDBOX}
                allowFullscreen={false}
                onSuccess={sucessoAoConectar}
                onClose={() => setConnectToken(null)}
                onLoadError={(error) => {
                  console.error('Falha ao carregar a Pluggy:', error);
                  setConnectToken(null);
                  setAvisoBanco('Não deu para abrir a conexão com o banco. Tente de novo.');
                }}
                onError={(error) => {
                  console.error('Erro na Pluggy:', error);
                  setConnectToken(null);
                  setAvisoBanco(
                    'A conexão falhou ou o banco pediu login de novo. Use “Reconectar banco”.',
                  );
                }}
              />
            </div>
          </div>
        )}

        <div className="lista-extrato">
          <div className="lista-extrato-topo">
            <h2 className="lista-titulo">Contas por vencimento</h2>
            <label className="lista-busca">
              <FaSearch size={14} aria-hidden="true" />
              <input
                type="search"
                placeholder="Buscar conta..."
                aria-label="Buscar conta"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </label>
            <div className="lista-filtros" role="group" aria-label="Filtro das contas">
              <button
                type="button"
                className={filtro === 'todos' ? 'ativo' : ''}
                onClick={() => setFiltro('todos')}
              >
                Todas
              </button>
              <button
                type="button"
                className={filtro === 'pagar' ? 'ativo' : ''}
                onClick={() => setFiltro('pagar')}
              >
                A pagar
              </button>
              <button
                type="button"
                className={filtro === 'pagas' ? 'ativo' : ''}
                onClick={() => setFiltro('pagas')}
              >
                Pagas
              </button>
            </div>
          </div>

          {carregando && <p className="lista-vazia">Carregando contas...</p>}

          {erro && !carregando && (
            <p className="lista-vazia" style={{ color: '#e07a70' }}>{erro}</p>
          )}

          {gruposMes.map((grupo) => (
            <section key={grupo.chave} className="grupo-mes">
              <h2>
                {grupo.rotulo}
                <span>{formatarDinheiro(grupo.total)}</span>
              </h2>
              {grupo.contas.map((item) => {
                const vencimento = dataDeAlerta(item);
                const paga = contaEstaPaga(item);

                return (
                  <CardsContas
                    key={item.id}
                    pago={paga}
                    foiPago={() => handleAlternarStatus(item.id)}
                    nome={item.nome}
                    preco={item.preco}
                    categoria={item.categoria}
                    periodicidade={rotuloPeriodicidade(item.periodicidade)}
                    data={formatarData(vencimento)}
                    historico={textoHistoricoGasto(item)}
                    aoRemover={() => setContaParaApagar(item.id)}
                    aoEditar={() => prepararEdicao(item)}
                    situacao={paga ? '' : verificarSituacao(vencimento)}
                    textoDias={diasRestantes(vencimento)}
                    situacaoHeuristica={item.situacao}
                    origem={item.origem}
                  />
                );
              })}
            </section>
          ))}

          {notificacao && <p className="lista-vazia" style={{ color: '#7dcea0' }}>{notificacao}</p>}

          {!carregando && listaContas.length === 0 && !erro && (
            <p className="lista-vazia">
              Nenhuma conta ainda. Conecte o banco ou adicione uma.
            </p>
          )}

          {!carregando && listaContas.length > 0 && contasVisiveis.length === 0 && (
            <p className="lista-vazia">Nenhuma conta nesse filtro.</p>
          )}

        </div>
      </main>

      <ModalConta
        aberto={modalContaAberto}
        editando={editandoId !== null}
        nome={nomeInput}
        preco={precoInput}
        data={dataInput}
        categoria={categoriaInput}
        onNome={setNomeInput}
        onPreco={setPrecoInput}
        onData={setDataInput}
        onCategoria={setCategoriaInput}
        periodicidade={cicloInput}
        onPeriodicidade={setCicloInput}
        onSalvar={salvarConta}
        onCancelar={limparFormulario}
      />

      <ModalDrenos
        aberto={modalDrenosAberto}
        contas={listaContas}
        gastoMensal={gastos.porMes}
        totalHistorico={jaGasto}
        onFechar={() => setModalDrenosAberto(false)}
      />

      <ModalConfirmacao
        aberto={contaParaApagar !== null}
        aoConfirmar={confirmarRemocao}
        aoCancelar={() => setContaParaApagar(null)}
      />
    </div>
  );
}
