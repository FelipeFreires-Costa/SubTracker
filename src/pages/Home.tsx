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
  const [contas, setContas] = useState<Conta[]>([]);

  //busca os dados do Servidor
  useEffect(() => {
    async function carregarDados() {
      try {
        const resposta = await fetch("http://localhost:3001/api/contas");
        const dados = await resposta.json();
        setContas(dados);
      } catch (erro) {
        console.error("Erro ao buscar contas:", erro);
        alert(
          "Erro ao conectar com o servidor! Verifique se ele está rodando.",
        );
      }
    }
    carregarDados();
  }, []);

  const [editandoId, setEditandoId] = useState<number | null>(null);

  const [nomeInput, setNomeInput] = useState("");
  const [precoInput, setPrecoInput] = useState("");
  const [dataInput, setDataInput] = useState("");
  const [categoriaInput, setCategoriaInput] = useState("");
  const [notificacao, setNotificacao] = useState<string | null>(null);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  function prepararEdicao(conta: Conta) {
    setNomeInput(conta.nome);
    setPrecoInput(conta.preco.toString());
    setDataInput(conta.data);
    setEditandoId(conta.id);
    setCategoriaInput(conta.categoria)
  }

  function formatarData(dataAmericana: string) {
    if (!dataAmericana) return "";
    const partes = dataAmericana.split("-");
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  function verificarSituacao(dataVencimento: string) {
    if (!dataVencimento) return "";
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const dataConta = new Date(dataVencimento + "T00:00:00");

    const diferenciaTime = dataConta.getTime() - hoje.getTime();
    const dias = Math.ceil(diferenciaTime / (1000 * 60 * 60 * 24));

    if (dias < 0) return "vencida";
    else if (dias === 0) return "hoje";
    else if (dias <= 3) return "perto";
    else return "tranquilo";
  }

  function diasRestantes(dataVencimento: string) {
    if (!dataVencimento) return "";
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataConta = new Date(dataVencimento + "T00:00:00");

    const diferenciaTime = dataConta.getTime() - hoje.getTime();
    const dias = Math.ceil(diferenciaTime / (1000 * 60 * 60 * 24));

    if (dias < 0) return `Venceu há ${Math.abs(dias)} dias`;
    else if (dias === 0) return "Vence hoje!";
    else if (dias === 1) return "Falta 1 dia";
    else return `Faltam ${dias} dias`;
  }

  async function removerConta(id: number) {
    if (!confirm("Tem a certeza que deseja remover esta conta?")) return;

    try {
      //manda o comando DELETE para o servidor com id na url
      const resposta = await fetch(`http://localhost:3001/api/contas/${id}`, {
        method: "DELETE",
      });

      if (resposta.ok) {
        //remove da tela se o servido confirmar que apagou
        const novaLista = contas.filter((item) => item.id !== id);
        setContas(novaLista);

        setNotificacao("item removido com sucesso!");
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          setNotificacao(null);
        }, 2000);
      } else {
        alert("Erro ao remover: A conta pode já não existir no servidor");
      }
    } catch (erro) {
      console.log(erro);
      alert("Erro de conexão ao tentar remover");
    }
  }

  async function adicionarConta() {
    if (nomeInput === "" || precoInput === "" || dataInput === "") {
      alert("Preencha todos os campos");
      return;
    }
    const novaConta: Conta = {
      id: Date.now(),
      nome: nomeInput,
      preco: Number(precoInput),
      data: dataInput,
      pago: false,
      categoria: categoriaInput,
    };

    try {
      const resposta = await fetch("http://localhost:3001/api/contas", {
        method: "POST", //metodo de criar
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(novaConta), //transforma objeto em texto
      });
      if (resposta.ok) {
        //servidor aceitou
        const contaCriada = await resposta.json();

        //adiciona na lista local para aparecer na tela
        setContas([...contas, contaCriada]);

        //limpar os campos
        setNomeInput("");
        setDataInput("");
        setPrecoInput("");
        setCategoriaInput("")
      } else {
        alert("Erro ao salvar no servidor!");
      }
    } catch (erro) {
      console.error(erro);
      alert("Erro de conexão! O servidor está rodando?");
    }
  }

  async function salvarEdicao() {
    if (nomeInput === "" || precoInput === "" || dataInput === "") {
      alert("Preencha todos os campos");
      return;
    }

    try {
      const resposta = await fetch(
        `http://localhost:3001/api/contas/${editandoId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: nomeInput,
            preco: Number(precoInput),
            data: dataInput,
            categoria: categoriaInput
          }),
        },
      );
      if (resposta.ok) {
        const contaAtualizada = await resposta.json(); //devolve a conta arrumada

        const listaAtualizada = contas.map((item) =>
          item.id === editandoId ? contaAtualizada : item,
        );
        setContas(listaAtualizada); //atualiza a tela
        setNomeInput("");
        setPrecoInput("");
        setDataInput("");
        setEditandoId(null);
        setCategoriaInput("")
        setNotificacao("Conta atualizada com sucesso!");
        setTimeout(() => setNotificacao(null), 2000);
      } else {
        alert("Erro ao atualizar no servidor!");
      }
    } catch (erro) {
      console.error(erro);
      alert("Erro de conexão");
    }
  }

  async function alternarStatus(id: number) {
    //encontra a conta atual para saber o oposto do status
    const contaAtual = contas.find((c) => c.id === id);
    if (!contaAtual) return;

    const novoStatus = !contaAtual.pago; //inverte se era true vira false

    try {
      //manda para o servidor
      const resposta = await fetch(`http://localhost:3001/api/contas/${id}`, {
        method: "PATCH", //metodo de atualizar parcialmente
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pago: novoStatus }), //manda so oque mudou
      });
      if (resposta.ok) {
        //se o servidor aceitou, atualiza a tela
        const contaAtualizada = await resposta.json();

        const listaAtualizada = contas.map((item) => {
          if (item.id === id) {
            return contaAtualizada; // usa o dado que veio do servidor
          }
          return item;
        });
        setContas(listaAtualizada);
      } else {
        ("Erro ao atualizar status");
      }
    } catch (erro) {
      console.error(erro);
      alert("Erro de conexão ao atualizar");
    }

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
  const valorTotalDivida = apenasDevedores.reduce(
    (total, item) => total + item.preco,
    0,
  );

  const valorPagos = contas.filter((item) => item.pago === true);
  const valoresPagos = valorPagos.reduce(
    (total, item) => total + item.preco,
    0,
  );

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
              type="number"
              placeholder="Ex: 75"
              value={precoInput}
              onChange={(e) => setPrecoInput(e.target.value)}
            />
          </div>

          <div className="card-span">
            <label htmlFor="data">Data:</label>
            <input
              id="data"
              type="date"
              value={dataInput}
              onChange={(e) => setDataInput(e.target.value)}
            />
          </div>

          <div className="card-span">
            <label htmlFor="categoria">Categoria:</label>
            <select
              id="categoria"
              value={categoriaInput}
              onChange={(e) => setCategoriaInput(e.target.value)}
            >
              <option value="">Selecione...</option>
              <option value="Streaming">Streaming</option>
              <option value="Moradia">Moradia</option>
              <option value="Alimentação">Alimentação</option>
              <option value="Educação">Educação</option>
              <option value="Transporte">Transporte</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          <div className="card-btn">
            {editandoId != null ? (
              <button
                style={{ backgroundColor: "#2a9d8f" }}
                onClick={salvarEdicao}
              >
                ✔ Salvar Alteração
              </button>
            ) : (
              <button onClick={adicionarConta}>+ Adicionar Conta</button>
            )}
            {editandoId !== null && (
              <button
                style={{ backgroundColor: "#6c757d", marginLeft: "10px" }}
                onClick={() => {
                  setEditandoId(null);
                  setNomeInput("");
                  setPrecoInput("");
                  setDataInput("");
                }}
              >
                Cancelar
              </button>
            )}
          </div>
        </div>

        {/* ... TABELA ... */}
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
              categoria={item.categoria}
              data={formatarData(item.data)}
              aoRemover={() => removerConta(item.id)}
              aoEditar={() => prepararEdicao(item)}
              situacao={verificarSituacao(item.data)}
              textoDias={diasRestantes(item.data)}
            />
          ))}

          {notificacao && (
            <p style={{ textAlign: "center", color: "green" }}>{notificacao}</p>
          )}

          {contas.length === 0 && (
            <p style={{ textAlign: "center", marginTop: 20 }}>
              Nenhuma conta encontrada.
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
            Desenvolvido por<strong> Felipe Costa</strong>
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
    </div>
  );
}
