import { useEffect, useState } from 'react';
import { FaMoneyBillTransfer } from 'react-icons/fa6';
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
  Legend,
} from 'recharts';
import type { Conta } from '../types/Conta';
import { contaService } from '../services/contaService';
import './Relatorio.css';

const CORES = ['#1589b5', '#2a9d8f', '#e8a317', '#c45c26', '#4a6fa5', '#b85c7a'];

export function Relatorio() {
  const [contas, setContas] = useState<Conta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregarDados() {
      try {
        const dados = await contaService.listar();
        setContas(dados);
      } catch (error) {
        console.error('Erro ao carregar dados para o gráfico:', error);
        setErro('Não foi possível carregar os dados do relatório.');
      } finally {
        setCarregando(false);
      }
    }

    carregarDados();
  }, []);

  const dadosParaGrafico = contas.map((conta) => ({
    name: conta.nome,
    value: Number(conta.preco),
  }));

  const valorTotal = contas.reduce((total, conta) => total + Number(conta.preco), 0);

  const gastosPorCategoria = contas.reduce<Record<string, number>>((acumulador, conta) => {
    const categoria = conta.categoria || 'Outros';
    acumulador[categoria] = (acumulador[categoria] ?? 0) + Number(conta.preco);
    return acumulador;
  }, {});

  const dadosPizza = Object.keys(gastosPorCategoria).map((chave) => ({
    name: chave,
    value: gastosPorCategoria[chave],
  }));

  return (
    <div className="relatorio-pagina">
      <h1>Seus gastos</h1>
      <p>Quanto vai em cada conta e em cada tipo.</p>

      {carregando && <p>Carregando relatório...</p>}
      {erro && <p style={{ color: '#c0392b' }}>{erro}</p>}

      <div className="relatorio-grade">
        <div className="relatorio-card">
          <h3>Quanto custa cada serviço</h3>

          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <BarChart
                data={dadosParaGrafico}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 13 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 13 }}
                  tickFormatter={(value) => `R$${value}`}
                />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value: number | string) => [
                    `R$ ${Number(value).toFixed(2)}`,
                    'Valor',
                  ]}
                />
                <Bar dataKey="value" fill="#1589b5" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="relatorio-card">
          <h3>Total do mês</h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '10px' }}>
            <p className="relatorio-total">
              {valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
            <FaMoneyBillTransfer size={36} color="#1589b5" />
          </div>

          <p style={{ color: '#5a635e', margin: '10px 0 0 0', fontSize: '1.05rem' }}>
            Soma de todas as contas
          </p>
        </div>

        <div className="relatorio-card">
          <h3>Gastos por tipo</h3>

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
                  {dadosPizza.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number | string) => [
                    `R$ ${Number(value).toFixed(2)}`,
                    'Total',
                  ]}
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  }}
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
