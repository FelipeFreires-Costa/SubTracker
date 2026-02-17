import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Conta } from "../../types/Conta";

interface ExpensesChartProps {
  contas: Conta[];
}

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042"];

export function ExpensesCharts({ contas }: ExpensesChartProps) {
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
                fill={COLORS[index % COLORS.length]}
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
