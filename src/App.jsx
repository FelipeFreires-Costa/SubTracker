import CardsContas from "./Components/CardsContas/CardsContas"
import Header from "./Components/Header/Header"
import { useEffect, useState, useRef } from "react"
import './App.css'

function App() {

  const [contas, setContas] = useState(() => {
    const dadosSalvos = localStorage.getItem("contas-pagar")

    if(dadosSalvos){
      return JSON.parse(dadosSalvos)
    } else{
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem("contas-pagar", JSON.stringify(contas))
  }, [contas])

  const [nomeInput, setNomeInput] = useState("")
  const [precoInput, setPrecoInput] = useState("")
  const [dataInput, setDataInput] = useState("")

  const [notificacao, setNotificacao] = useState(null)
  const timeoutRef = useRef()

  function formatarData(dataAmericana){
    if(!dataAmericana) return ""

    const partes = dataAmericana.split('-')
    return `${partes[2]}/${partes[1]}/${partes[0]}`
  }

  function verificarSituacao(dataVencimento){
    if(!dataVencimento) return ""
    const hoje = new Date()
    hoje.setHours(0,0,0,0)

    const dataConta = new Date(dataVencimento + "T00:00:00")

    const diferenciaTime = dataConta - hoje

    const dias = Math.ceil(diferenciaTime / (1000 * 60 * 60 * 24))

    if(dias < 0){
      return "vencida"
    }else if(dias === 0){
      return 'hoje'
    }else if(dias <= 3){
      return "perto"
    }else{
      return "tranquilo"
    }
  }

  function removerConta(id){
    const novaConta = contas.filter((item) => item.id !== id)

    setContas(novaConta)
    setNotificacao("Item removido!")

    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setNotificacao(null)
    }, 2000)
  }

  function adicionarConta(){
    if(nomeInput === "" || precoInput === "" || dataInput === ""){
      alert("Preencha todos os campos")
      return
    }

    const novaConta = {
      id: Date.now(),
      nome: nomeInput,
      preco: Number(precoInput),
      data: dataInput,
      pago: false
    }
    setContas([...contas, novaConta])

    setNomeInput("")
    setDataInput("")
    setPrecoInput("")
  }

  function alternarStatus(id){
    const lista = contas.map(item => {
      if(item.id === id){
        return {...item, pago: !item.pago}
      }else{
        return item
      }
    })
    setContas(lista)
  }
  
  const precoTotal = contas.reduce((acc, item) => {
    if(item.pago === true){
      return acc
    } else{
      return acc + Number(item.preco)
    }
  }, 0)

  console.log(contas)

  return (
  <div>

    <div>
        <input type="text" placeholder="Nome" value={nomeInput} onChange={(e) => setNomeInput(e.target.value)} />
        <input type="Number" placeholder="Preço" value={precoInput} onChange={(e) => setPrecoInput(e.target.value)}/>
        <input type="Date" min="1" max="31" value={dataInput} onChange={(e) => setDataInput(e.target.value)}/>
        <button onClick={adicionarConta}>Adicionar Conta</button>
    </div>
    <div className="container">
      <div className="header-table">
        <span>Nome</span>
        <span>Preço</span>
        <span>Vencimento</span>
        <span>Status</span>
        <span></span>
        <span></span>
        <span>Ação</span>        
      </div>

        {
          contas.map((item) => (
            <CardsContas key={item.id} pago={item.pago} foiPago={() => alternarStatus(item.id)} nome={item.nome} preco={item.preco} data={formatarData(item.data)} aoRemover={() => removerConta(item.id)} situacao={verificarSituacao(item.data) }/>
          ))}
          <p>{notificacao}</p>
    {
      contas.length === 0 && <p>Nenhuma conta adicionada</p>
    }          
    <Header valorTotal={precoTotal} />
    </div>

  </div>
  )
}

export default App
