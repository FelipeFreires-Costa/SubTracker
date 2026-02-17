import { useEffect, useState, useRef } from "react";
import CardsContas from "../Components/CardsContas/CardsContas";
import {
  FaMoneyBillWave,
  FaExclamationCircle,
  FaCheckCircle,
  FaLinkedin,
  FaGithub,
} from "react-icons/fa";
import { Conta } from "../types/Conta";
export function Home() {
  // const [contas, setContas] = useState(() => {
  //   const dadosSalvos = localStorage.getItem("contas-pagar");
  //   if (dadosSalvos) {
  //     return JSON.parse(dadosSalvos);
  //   } else {
  //     return [];
  //   }
  // });

  const [contas, setContas] = useState<Conta[]>([]);

// 2. useEffect para carregar os dados ASSIM QUE A TELA ABRIR
  useEffect(() => {
    // Função assíncrona (promessa)
    async function carregarDados() {
      try {
        // "Fetch" = Buscar. Bate na porta 3001
        const resposta = await fetch('http://localhost:3001/api/contas');
        
        // Converte a resposta (texto) para JSON (objeto JS)
        const dados = await resposta.json();

        // Atualiza o estado com os dados do servidor!
        setContas(dados);
        
      } catch (erro) {
        console.error("Erro ao buscar contas:", erro);
        alert("Erro ao conectar com o servidor! Verifique se ele está rodando.");
      }
    }

    carregarDados();
  }, []); // Array vazio = Roda apenas uma vez na montagem

  const [nomeInput, setNomeInput] = useState("");
  const [precoInput, setPrecoInput] = useState("");
  const [dataInput, setDataInput] = useState("");
  const [notificacao, setNotificacao] = useState(null);
  const timeoutRef = useRef();

  function formatarData(dataAmericana) {
    if (!dataAmericana) return "";
    const partes = dataAmericana.split("-");
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  function verificarSituacao(dataVencimento) {
    if (!dataVencimento) return "";
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataConta = new Date(dataVencimento + "T00:00:00");
    const diferenciaTime = dataConta - hoje;
    const dias = Math.ceil(diferenciaTime / (1000 * 60 * 60 * 24));

    if (dias < 0) return "vencida";
    else if (dias === 0) return "hoje";
    else if (dias <= 3) return "perto";
    else return "tranquilo";
  }

  function diasRestantes(dataVencimento) {
    if (!dataVencimento) return "";
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataConta = new Date(dataVencimento + "T00:00:00");
    const diferenciaTime = dataConta - hoje;
    const dias = Math.ceil(diferenciaTime / (1000 * 60 * 60 * 24));

    if (dias < 0) return `Venceu há ${Math.abs(dias)} dias`;
    else if (dias === 0) return "Vence hoje!";
    else if (dias === 1) return "Falta 1 dia";
    else return `Faltam ${dias} dias`;
  }

  function removerConta(id) {
    const novaConta = contas.filter((item) => item.id !== id);
    setContas(novaConta);
    setNotificacao("Item removido!");
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setNotificacao(null);
    }, 2000);
  }

  function adicionarConta() {
    if (nomeInput === "" || precoInput === "" || dataInput === "") {
      alert("Preencha todos os campos");
      return;
    }
    const novaConta = {
      id: Date.now(),
      nome: nomeInput,
      preco: Number(precoInput),
      data: dataInput,
      pago: false,
    };
    setContas([...contas, novaConta]);
    setNomeInput("");
    setDataInput("");
    setPrecoInput("");
  }

  function alternarStatus(id) {
    const lista = contas.map((item) => {
      if (item.id === id) {
        return { ...item, pago: !item.pago };
      } else {
        return item;
      }
    });
    setContas(lista);
  }

  const apenasDevedores = contas.filter((item) => item.pago === false);
  const valorTotalDivida = apenasDevedores.reduce((total, item) => total + item.preco, 0);
  const valorPagos = contas.filter((item) => item.pago === true);
  const valoresPagos = valorPagos.reduce((total, item) => total + item.preco, 0);
  const despesasTotal = contas.reduce((acc, item) => acc + item.preco, 0);

  return (
    <div className="home-content">
      <main className="main-content">
        <div className="resumo-cards">
          <div className="card-resumo total">
            <div className="card-head">
              <span>Total Mensal</span>
              <FaMoneyBillWave size={24} color="#333" />
            </div>
            <h2 className="valor-total">R$ {despesasTotal.toFixed(2)}</h2>
          </div>

          <div className="card-resumo divida">
            <div className="card-head">
              <span>Falta Pagar</span>
              <FaExclamationCircle size={24} color="#e63946" />
            </div>
            {valorTotalDivida === 0 ? (
              <h2>R$ 00.00</h2>
            ) : (
              <h2 className="valor-divida">R$ {valorTotalDivida.toFixed(2)}</h2>
            )}
          </div>

          <div className="card-resumo alivio">
            <div className="card-head">
              <span>Já Pago</span>
              <FaCheckCircle size={24} color="#2a9d8f" />
            </div>
            <h2 className="valor-pago">R$ {valoresPagos.toFixed(2)}</h2>
          </div>
        </div>

        <div className="form">
          <div className="card-span">
            <label htmlFor="nome">Nome:</label>
            <input
              id="nome"
              type="text"
              placeholder="Ex: Conta de luz"
              value={nomeInput}
              onChange={(e) => setNomeInput(e.target.value)}
            />
          </div>

          <div className="card-span">
            <label htmlFor="preco">Preço:</label>
            <input
              id="preco"
              type="Number"
              placeholder="Ex: 75"
              value={precoInput}
              onChange={(e) => setPrecoInput(e.target.value)}
            />
          </div>

          <div className="card-span">
            <label htmlFor="data">Data:</label>
            <input
              id="data"
              type="Date"
              value={dataInput}
              onChange={(e) => setDataInput(e.target.value)}
            />
          </div>

          <div className="card-btn">
            <button onClick={adicionarConta}>+ Adicionar Conta</button>
          </div>
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

          {contas.map((item) => (
            <CardsContas
              key={item.id}
              pago={item.pago}
              foiPago={() => alternarStatus(item.id)}
              nome={item.nome}
              preco={item.preco}
              data={formatarData(item.data)}
              aoRemover={() => removerConta(item.id)}
              situacao={verificarSituacao(item.data)}
              textoDias={diasRestantes(item.data)}
            />
          ))}

          <p>{notificacao}</p>
          {contas.length === 0 && <p>Nenhuma conta adicionada</p>}
        </div>
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <strong>SubTracker</strong>
          <span>&copy; 2026 - Todos os direitos reservados.</span>
        </div>
        <div className="footer-center">
          <span>
            Desenvolvido por<strong> Felipe Costa</strong>
          </span>
        </div>
        <div className="footer-socials">
          <a href="https://www.linkedin.com/in/felipefreires/" target="_blank" rel="noopener noreferrer">
            <FaLinkedin size={22} />
          </a>
          <a href="https://github.com/FelipeFreires-Costa" target="_blank" rel="noopener noreferrer">
            <FaGithub size={22} />
          </a>
        </div>
      </footer>
    </div>
  );
}