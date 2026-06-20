"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

interface ChartProps {
  data: { name: string; value: number }[];
  color?: string;
  type?: "bar" | "line";
}

export function StatsChart({ data, color = "#00D9FF", type = "bar" }: ChartProps) {
  if (!data.length) {
    return (
      <div className="h-64 flex items-center justify-center text-white/30">
        No data available yet
      </div>
    );
  }

  const Chart = type === "bar" ? BarChart : LineChart;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <Chart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis
          dataKey="name"
          tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
          axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
        />
        <YAxis
          tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
          axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
        />
        <Tooltip
          contentStyle={{
            background: "rgba(26,10,46,0.95)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "12px",
            color: "#fff",
          }}
        />
        {type === "bar" ? (
          <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} />
        ) : (
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ fill: color }} />
        )}
      </Chart>
    </ResponsiveContainer>
  );
}
