﻿import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Point = { month: string; value: number };
export default function NetWorthBar({ data }: { data: Point[] }) {
  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
          {/* subtle grid */}
          <CartesianGrid stroke="#e7eef6" vertical={false} />

          {/* axes */}
          <XAxis
            dataKey="month"
            tick={{ fill: "#64748b" }}
            tickLine={false}
            axisLine={{ stroke: "#e7eef6" }}
          />
          <YAxis
            tickFormatter={(n) =>
              n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n}`
            }
            tick={{ fill: "#64748b" }}
            tickLine={false}
            axisLine={{ stroke: "#e7eef6" }}
          />

          <Tooltip
            cursor={{ fill: "rgba(0,0,0,0.04)" }}
            formatter={(v: number) =>
              v.toLocaleString(undefined, { style: "currency", currency: "USD" })
            }
            contentStyle={{
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
            }}
          />

          {/* --- Gradients & shadow for 3D effect --- */}
          <defs>
            {/* main green gradient (front face) */}
            <linearGradient id="barGreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" />    {/* emerald-500 */}
              <stop offset="100%" stopColor="#059669" />  {/* emerald-600 */}
            </linearGradient>

            {/* highlight on the left edge */}
            <linearGradient id="leftShine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="rgba(255,255,255,0.36)" />
              <stop offset="1" stopColor="rgba(255,255,255,0)" />
            </linearGradient>

            {/* soft drop shadow */}
            <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="6" stdDeviation="6" floodOpacity="0.22" />
            </filter>
          </defs>

          {/* Main bars with rounded top corners + shadow */}
          <Bar
            dataKey="value"
            radius={[10, 10, 0, 0]}
            fill="url(#barGreen)"
            barSize={56}
            maxBarSize={56}
            filter="url(#softShadow)"
            // custom shape to add a “top face” and side shine for a 3D feel
            shape={(props: any) => {
              const { x, y, width, height } = props;
              const top = y - 6;          // small cap height
              const capH = 6;

              return (
                <g>
                  {/* front face */}
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    rx={10}
                    ry={10}
                    fill="url(#barGreen)"
                  />
                  {/* top face (lighter cap) */}
                  <rect
                    x={x}
                    y={top}
                    width={width}
                    height={capH}
                    rx={10}
                    ry={10}
                    fill="rgba(255,255,255,0.18)"
                  />
                  {/* subtle left shine */}
                  <rect
                    x={x}
                    y={y + 8}
                    width={8}
                    height={height - 16}
                    fill="url(#leftShine)"
                    rx={6}
                  />
                </g>
              );
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}