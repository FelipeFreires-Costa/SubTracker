import { useMemo, useState } from 'react';
import CardsContas from '../Components/CardsContas/CardsContas';
import { PluggyConnect } from 'react-pluggy-connect';
import { FaSearch } from 'react-icons/fa';
import { ModalConfirmacao } from '../Components/ModalConfirmacao/ModalConfirmacao';
import { ModalConta } from '../Components/ModalConta/ModalConta';
import { useContas } from '../hooks/useContas';
import { pluggyService } from '../services/pluggyService';
import {
  resumoDeGastos,
  dataDeAlerta,
  diasRestantes,
  formatarData,
  formatarDinheiro,
  proximaContaAberta,
  resumoAlertas,
  rotuloPeriodicidade,
  verificarSituacao,
  ehParcela,
  nomeParaExibicao,
  contaEstaPaga,
  agruparPorMes,
} from '../utils/contaHelpers';

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

  const listaContas = useMemo(
    () => contas.filter((conta) => !ehParcela(conta)),
    [contas],
  );
  const gastos = useMemo(() => resumoDeGastos(listaContas), [listaContas]);

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
      const dados = await pluggyService.obterConnectToken();
      setConnectToken(dados.accessToken);
    } catch (error) {
      tratarErro(error, 'Não foi possível abrir a conexão com o banco.');
      alert('Não foi possível abrir a conexão com o banco. Tente de novo em instantes.');
    }
  }

  async function atualizarDoBanco() {
    try {
      await sincronizarPluggy();
    } catch (error) {
      tratarErro(error, 'Não deu para atualizar as assinaturas.');
      alert('Não deu para atualizar as assinaturas. Tente conectar o banco de novo.');
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

  function textoUltimaSincronizacao() {
    if (!conexao.ultimaSincronizacao) return '';
    const data = new Date(conexao.ultimaSincronizacao);
    if (Number.isNaN(data.getTime())) return '';
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  async function sucessoAoConectar(itemData: { item: { id: string } }) {
    try {
      await importarDaPluggy(itemData.item.id);
      setConnectToken(null);
    } catch (error) {
      console.error('Erro ao importar assinaturas:', error);
      alert('O banco foi conectado, mas não deu para trazer as assinaturas. Tente Atualizar.');
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
          <h1>Contas</h1>
          <p>Suas assinaturas e contas fixas, organizadas por mês.</p>
        </header>

        <div className="resumo-cards">
          <div className="card-resumo total">
            <span>Você gasta por mês</span>
            <h2>{formatarDinheiro(gastos.porMes)}</h2>
            <p className="card-resumo-nota">
              {formatarDinheiro(gastos.porAno)} por ano ·{' '}
              {listaContas.length === 1 ? '1 conta' : `${listaContas.length} contas`}
            </p>
          </div>

          <div className="card-resumo divida">
            <span>Falta pagar este mês</span>
            <h2 className={gastos.aPagarNoMes === 0 ? 'valor-pago' : 'valor-divida'}>
              {formatarDinheiro(gastos.aPagarNoMes)}
            </h2>
            <p className="card-resumo-nota">
              {formatarDinheiro(gastos.pagoNoMes)} já pago
            </p>
          </div>

          <div className="card-resumo alivio">
            <span>Próxima cobrança</span>
            <h2 className={alertas.atrasadas > 0 ? 'valor-divida' : ''}>
              {proxima
                ? nomeParaExibicao(proxima.nome)
                : 'Nada em aberto'}
            </h2>
            <p className="card-resumo-nota">
              {proxima
                ? `${formatarData(dataDeAlerta(proxima))} · ${formatarDinheiro(proxima.preco)}`
                : 'Tudo pago por enquanto'}
              {alertas.atrasadas > 0
                ? ` · ${alertas.atrasadas} atrasada${alertas.atrasadas === 1 ? '' : 's'}`
                : ''}
              {alertas.hoje > 0 ? ` · ${alertas.hoje} hoje` : ''}
              {alertas.proximas > 0
                ? ` · ${alertas.proximas} em 3 dias`
                : ''}
            </p>
          </div>
        </div>

        <div className="acoes-contas">
          <button className="btn-nova-conta" onClick={abrirNovaConta}>
            Adicionar
          </button>
          {!connectToken && conexao.conectado && (
            <button type="button" onClick={atualizarDoBanco}>
              Atualizar
            </button>
          )}
          {!connectToken && (
            <button type="button" onClick={abrirWidget}>
              {conexao.conectado ? 'Trocar banco' : 'Conectar banco'}
            </button>
          )}
          {!connectToken && conexao.exportarExtratoAtivo && (
            <button
              type="button"
              className="pluggy-secundario"
              onClick={baixarExtrato}
              disabled={!conexao.conectado || baixandoExtrato}
            >
              {baixandoExtrato ? 'Baixando...' : 'Baixar extrato'}
            </button>
          )}
          {!connectToken && conexao.conectado && (
            <button type="button" className="pluggy-secundario" onClick={desconectarBanco}>
              Desconectar
            </button>
          )}
          {!connectToken && MODO_SANDBOX && (
            <button type="button" className="pluggy-secundario" onClick={carregarCenariosTeste}>
              Cenários de teste
            </button>
          )}
          {conexao.conectado && conexao.ultimaSincronizacao && (
            <span className="acao-nota">Atualizado {textoUltimaSincronizacao()}</span>
          )}
        </div>

        {connectToken && (
          <div className="pluggy-widget">
            <PluggyConnect
              connectToken={connectToken}
              includeSandbox={MODO_SANDBOX}
              onSuccess={sucessoAoConectar}
              onError={(error) => console.error('Erro na Pluggy:', error)}
            />
          </div>
        )}

        <div className="lista-extrato">
          <div className="lista-extrato-topo">
            <h2 className="lista-titulo">Todas as contas</h2>
            <label className="lista-busca">
              <FaSearch size={14} />
              <input
                type="search"
                placeholder="Buscar conta..."
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
                    aoRemover={() => setContaParaApagar(item.id)}
                    aoEditar={() => prepararEdicao(item)}
                    situacao={paga ? '' : verificarSituacao(vencimento)}
                    textoDias={diasRestantes(vencimento)}
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

      <ModalConfirmacao
        aberto={contaParaApagar !== null}
        aoConfirmar={confirmarRemocao}
        aoCancelar={() => setContaParaApagar(null)}
      />
    </div>
  );
}
