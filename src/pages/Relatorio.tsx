import { ExpensesCharts } from '../Components/ExpensesChart/ExpensesCharts';
import { useEffect, useState } from "react";
import { Conta } from "../types/Conta";
import { FaMoneyBillTransfer } from "react-icons/fa6";
import './Relatorio.css'

export function Relatorio() {
const [contasSalvas, setContasSalvas] = useState<Conta[]>([])

useEffect(() => {
    // busca os dados do LocalStorage quando entra na página
    const dados = localStorage.getItem("contas-pagar");
    if (dados) {
      setContasSalvas(JSON.parse(dados));
    }
  }, []);

  const valorTotal = contasSalvas.reduce((total, conta) => {
    return total + conta.preco;
  }, 0)

  return (
    <div style={{ padding: '20px' }}>
      <h1>Painel Financeiro</h1>
      <p>Visão geral das suas assinaturas e contas.</p>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '20px', 
        marginTop: '20px' 
      }}>

        <div style={{ 
          background: '#fff', 
          padding: '20px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)' 
        }}>
          <ExpensesCharts contas={contasSalvas}/>
        </div>


        <div style={{ 
          background: '#fff', 
          padding: '20px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)' 
        }}>
          <h3>Resumo Mensal</h3>
          <p className='valor-total' style={{ fontSize: '24px', fontWeight: 'bold', color: '#0077ff' }}>
            R$ {valorTotal.toFixed(2)}
          <FaMoneyBillTransfer size={32} color="#0077ff" opacity={1} />
          </p>
          <p style={{ color: '#7f8c8d' }}>Total em Assinaturas</p>
        </div>
      </div>
    </div>
  );
}