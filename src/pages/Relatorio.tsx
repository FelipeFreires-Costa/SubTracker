import { useEffect, useState } from "react";
import { Conta } from "../types/Conta";
import { FaMoneyBillTransfer } from "react-icons/fa6";
import './Relatorio.css';

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

export function Relatorio() {
  const [contas, setContas] = useState<Conta[]>([]);

  //assim que a página abrir, pede os dados para o backend
  useEffect(() => {
    async function carregarDados() {
      try {
        const resposta = await fetch("https://api-subtracker.onrender.com/api/contas");
        const dadosDB = await resposta.json();
        setContas(dadosDB);
      } catch (erro) {
        console.error("Erro ao carregar dados para o gráfico: ", erro);
      }
    }
    carregarDados();
  }, []);

  const dadosParaGrafico = contas.map(conta => ({
    name: conta.nome,
    value: Number(conta.preco)
  }));


  const valorTotal = contas.reduce((acumulador, conta) => acumulador + Number(conta.preco), 0);

  const gastosPorCategoria = contas.reduce((acumulador: any, conta) => {
    const categoria = conta.categoria || "Outros"; 
    
    if (!acumulador[categoria]) {
      acumulador[categoria] = 0; 
    }
    acumulador[categoria] += Number(conta.preco); 
    return acumulador;
  }, {});

  const dadosPizza = Object.keys(gastosPorCategoria).map(chave => ({
    name: chave,
    value: gastosPorCategoria[chave]
  }));

  const CORES = ['#0077ff', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#e83e8c'];


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

        {/* grafico de barra */}
        <div style={{ 
          background: '#fff', 
          padding: '20px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)' 
        }}>
          <h3 style={{ marginBottom: '20px', color: '#334155' }}>Custo por Serviço</h3>
          
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <BarChart data={dadosParaGrafico} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13 }} tickFormatter={(value) => `R$${value}`} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, 'Valor']}
                />
                <Bar dataKey="value" fill="#0077ff" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* resumo mensal */}
        <div style={{ 
          background: '#fff', 
          padding: '20px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <h3 style={{ color: '#334155', marginTop: 0 }}>Resumo Mensal</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '10px' }}>
            <p className='valor-total' style={{ fontSize: '32px', fontWeight: 'bold', color: '#0077ff', margin: 0 }}>
              R$ {valorTotal.toFixed(2)}
            </p>
            <FaMoneyBillTransfer size={36} color="#0077ff" />
          </div>
          
          <p style={{ color: '#7f8c8d', margin: '10px 0 0 0' }}>Total em Assinaturas</p>
        </div>

        {/* grafico pizza */}
        <div style={{ 
          background: '#fff', 
          padding: '20px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)' 
        }}>
          <h3 style={{ marginBottom: '20px', color: '#334155' }}>Gastos por Categoria</h3>
          
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={dadosPizza}
                  cx="50%" 
                  cy="50%" 
                  innerRadius={60} 
                  outerRadius={80} 
                  paddingAngle={5} 
                  dataKey="value"
                >
                  {dadosPizza.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, 'Total']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}