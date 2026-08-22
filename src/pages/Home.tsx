import { useState } from 'react';
import CardsContas from '../Components/CardsContas/CardsContas';
import { PluggyConnect } from 'react-pluggy-connect';
import {
  FaMoneyBillWave,
  FaExclamationCircle,
  FaCheckCircle,
  FaLinkedin,
  FaGithub,
} from 'react-icons/fa';
import { ModalConfirmacao } from '../Components/ModalConfirmacao/ModalConfirmacao';
import { ModalConta } from '../Components/ModalConta/ModalConta';
import { useContas } from '../hooks/useContas';
import { pluggyService } from '../services/pluggyService';
import {
  calcularResumoFinanceiro,
  diasRestantes,
  formatarData,
  formatarDinheiro,
  verificarSituacao,
} from '../utils/contaHelpers';

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
  } = useContas();

  const [connectToken, setConnectToken] = useState<string | null>(null);
  const [contaParaApagar, setContaParaApagar] = useState<number | null>(null);
  const [modalContaAberto, setModalContaAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [nomeInput, setNomeInput] = useState('');
  const [precoInput, setPrecoInput] = useState('');
  const [dataInput, setDataInput] = useState('');
  const [categoriaInput, setCategoriaInput] = useState('');

  const { totalMensal, totalPago, faltaPagar } = calcularResumoFinanceiro(contas);

  function limparFormulario() {
    setNomeInput('');
    setPrecoInput('');
    setDataInput('');
    setCategoriaInput('');
    setEditandoId(null);
    setModalContaAberto(false);
  }

  function abrirNovaConta() {
    setNomeInput('');
    setPrecoInput('');
    setDataInput('');
    setCategoriaInput('');
    setEditandoId(null);
    setModalContaAberto(true);
  }

  function validarFormulario() {
    if (!nomeInput || !precoInput || !dataInput) {
      alert('Preencha todos os campos');
      return false;
    }
    return true;
  }

  async function abrirWidget() {
    try {
      const dados = await pluggyService.obterConnectToken();
      setConnectToken(dados.accessToken);
    } catch (error) {
      tratarErro(error, 'Verifique se o backend está rodando na porta 3000');
      alert('Verifique se o backend está rodando na porta 3000');
    }
  }

  async function sucessoAoConectar(itemData: { item: { id: string } }) {
    try {
      await importarDaPluggy(itemData.item.id);
      setConnectToken(null);
    } catch (error) {
      console.error('Erro ao importar assinaturas:', error);
      alert('Conectou no banco, mas deu erro ao importar as assinaturas.');
    }
  }

  async function confirmarRemocao() {
    if (contaParaApagar === null) return;

    try {
      await removerConta(contaParaApagar);
    } catch (error) {
      tratarErro(error, 'Erro ao remover conta.');
      alert('Erro ao remover conta.');
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
      });
      limparFormulario();
    } catch (error) {
      tratarErro(error, 'Erro ao salvar no servidor.');
      alert('Erro ao salvar no servidor!');
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
      });
      limparFormulario();
    } catch (error) {
      tratarErro(error, 'Erro ao atualizar no servidor.');
      alert('Erro ao atualizar no servidor!');
    }
  }

  async function handleAlternarStatus(id: number) {
    try {
      await alternarStatus(id);
    } catch (error) {
      tratarErro(error, 'Erro ao atualizar status.');
      alert('Erro ao atualizar status.');
    }
  }

  function prepararEdicao(conta: (typeof contas)[number]) {
    setNomeInput(conta.nome);
    setPrecoInput(conta.preco.toString());
    setDataInput(conta.data);
    setCategoriaInput(conta.categoria);
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
        <div className="resumo-cards">
          <div className="card-resumo total">
            <div className="card-head">
              <span>Total Mensal</span>
              <FaMoneyBillWave size={24} color="#333" />
            </div>
            <h2 className="valor-total">{formatarDinheiro(totalMensal)}</h2>
          </div>

          <div className="card-resumo divida">
            <div className="card-head">
              <span>Falta Pagar</span>
              <FaExclamationCircle size={24} color="#e63946" />
            </div>
            <h2 className={faltaPagar === 0 ? '' : 'valor-divida'}>
              {formatarDinheiro(faltaPagar)}
            </h2>
          </div>

          <div className="card-resumo alivio">
            <div className="card-head">
              <span>Já Pago</span>
              <FaCheckCircle size={24} color="#2a9d8f" />
            </div>
            <h2 className="valor-pago">{formatarDinheiro(totalPago)}</h2>
          </div>
        </div>

        <div className="acoes-contas">
          <button className="btn-nova-conta" onClick={abrirNovaConta}>
            Adicionar conta
          </button>
        </div>

        <div className="pluggy-box">
          <h2>Achar assinaturas no banco</h2>
          <p>O sistema procura no extrato coisas como Netflix e Spotify e coloca na lista.</p>

          {!connectToken ? (
            <button onClick={abrirWidget}>Abrir conexão</button>
          ) : (
            <div className="pluggy-widget">
              <PluggyConnect
                connectToken={connectToken}
                includeSandbox={true}
                onSuccess={sucessoAoConectar}
                onError={(error) => console.error('Erro na Pluggy:', error)}
              />
            </div>
          )}
        </div>

        <div className="container">
          <div className="header-table">
            <span>Nome</span>
            <span>Preço</span>
            <span>Vencimento</span>
            <span>Status</span>
            <span></span>
            <span className="alinhar-texto">Ação</span>
          </div>

          {carregando && (
            <p style={{ textAlign: 'center', marginTop: 20 }}>Carregando contas...</p>
          )}

          {erro && !carregando && (
            <p style={{ textAlign: 'center', marginTop: 20, color: '#e63946' }}>{erro}</p>
          )}

          {contas.map((item) => (
            <CardsContas
              key={item.id}
              pago={item.pago}
              foiPago={() => handleAlternarStatus(item.id)}
              nome={item.nome}
              preco={item.preco}
              categoria={item.categoria}
              data={formatarData(item.data)}
              aoRemover={() => setContaParaApagar(item.id)}
              aoEditar={() => prepararEdicao(item)}
              situacao={verificarSituacao(item.data)}
              textoDias={diasRestantes(item.data)}
            />
          ))}

          {notificacao && (
            <p style={{ textAlign: 'center', color: 'green' }}>{notificacao}</p>
          )}

          {!carregando && contas.length === 0 && !erro && (
            <p style={{ textAlign: 'center', marginTop: 20 }}>
              Nenhuma conta ainda. Toque em Adicionar conta ou busque no banco.
            </p>
          )}
        </div>
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <strong>SubTracker</strong>
          <span>&copy; 2026 - Todos os direitos reservados.</span>
        </div>
        <div className="footer-center">
          <span>
            Desenvolvido por <strong> Felipe Freires</strong>
          </span>
        </div>
        <div className="footer-socials">
          <a
            href="https://www.linkedin.com/in/felipefreires/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaLinkedin size={22} />
          </a>
          <a
            href="https://github.com/FelipeFreires-Costa"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaGithub size={22} />
          </a>
        </div>
      </footer>

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
