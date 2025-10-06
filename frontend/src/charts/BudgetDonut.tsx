import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from "recharts";
import type { BudgetSlice } from "../types";
const COLORS = ["#16a34a", "#f97316", "#6366f1"];
export default function BudgetDonut({ data }: { data: BudgetSlice[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3}>
            {data.map((s, i) => <Cell key={s.name} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Legend />
          <Tooltip formatter={(v: number) => v.toLocaleString(undefined, { style: "currency", currency: "USD" })} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
