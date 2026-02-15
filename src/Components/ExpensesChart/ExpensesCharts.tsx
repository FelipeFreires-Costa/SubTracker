import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const data = [
  { name: "Streaming", value: 120 },
  { name: "Transporte", value: 350 },
  { name: "Lazer", value: 200 },
  { name: "Alimentação", value: 500 },
];

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042"];

export function ExpensesCharts() {
  return (
    <div style={{ width: "100%", height: 300 }}>
      <h3>Gasto por categoria</h3>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
