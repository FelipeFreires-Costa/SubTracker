import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Conta } from "../../types/Conta";

interface ExpensesChartProps {
  contas: Conta[];
}


export function ExpensesCharts({ contas }: ExpensesChartProps) {
  const CORES = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#e83e8c'];

  const gastoPorCategoria = contas.reduce((acumulador: any, conta) => {
    const categoria = conta.categoria || "Outros"

    if(!acumulador[categoria]){
      acumulador[categoria] = 0
    }
    acumulador[categoria] += Number(conta.preco)
    return acumulador
  }, {})

  //transformar no formato que o rechard exige
  const dadosPizza = Object.keys(gastoPorCategoria).map(chave => ({
    name: chave,
    value: gastoPorCategoria[chave]
  }))

  const dadosDoGrafico = contas.map((conta) => ({
    name: conta.nome,
    value: Number(conta.preco),
  }));
  if (contas.length === 0) {
    return (
      <p style={{ textAlign: "center", color: "#666" }}>
        Nenhum dado para gerar o gráfico.
      </p>
    );
  }
  return (
    <div style={{ width: "100%", height: 300 }}>
      <h3>Gasto por categoria</h3>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={dadosDoGrafico}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            dataKey="value"
          >
            {dadosDoGrafico.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={CORES[index % CORES.length]}
              />
            ))}
          </Pie>
          <Tooltip formatter={(value: any) => `R$ ${Number(value).toFixed(2)}`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
