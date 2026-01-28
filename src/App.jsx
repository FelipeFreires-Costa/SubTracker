import CardsContas from "./Components/CardsContas/CardsContas"
import Header from "./Components/Header/Header"
import { useEffect, useState } from "react"

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



  function formatarData(dataAmericana){
    if(!dataAmericana) return ""

    const partes = dataAmericana.split('-')
    return `${partes[2]}/${partes[1]}/${partes[0]}`
  }

  function removerConta(id){
    const novaConta = contas.filter((item) => item.id !== id)

    setContas(novaConta)
  }

  function adicionarConta(){
    if(nomeInput === "" || precoInput === "" || dataInput === ""){
      alert("Preencha todos os campos")
      return
    }

    const novaConta = {
      id: Date.now(),
      nome: nomeInput,
      preco: precoInput,
      data: dataInput
    }
    setContas([...contas, novaConta])

    setNomeInput("")
    setDataInput("")
    setPrecoInput("")
  }
  console.log(contas)
  return (
  <div>
    <Header />

    <div>
        <input type="text" placeholder="Nome" value={nomeInput} onChange={(e) => setNomeInput(e.target.value)} />
        <input type="Number" placeholder="Preço" value={precoInput} onChange={(e) => setPrecoInput(e.target.value)}/>
        <input type="Date" min="1" max="31" value={dataInput} onChange={(e) => setDataInput(e.target.value)}/>
        <button onClick={adicionarConta}>Adicionar Conta</button>
    </div>

    {
      contas.map((item) => (
        <CardsContas key={item.id} nome={item.nome} preco={item.preco} data={formatarData(item.data)} aoRemover={() => removerConta(item.id)}/>
      ))}
    {
      contas.length === 0 && <p>Nenhuma conta adicionada</p>
    }
  </div>
  )
}

export default App
