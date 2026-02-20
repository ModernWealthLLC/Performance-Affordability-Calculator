"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface ComparisonChartProps {
  fvNoCar: number;
  fvWithCar: number;
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: { name: string } }>;
}) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 shadow-xl">
      <p className="text-neutral-400 text-xs">{payload[0].payload.name}</p>
      <p className="text-white font-semibold text-lg">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
}

export default function ComparisonChart({
  fvNoCar,
  fvWithCar,
}: ComparisonChartProps) {
  const data = [
    { name: "Without Car", value: fvNoCar },
    { name: "With Car", value: fvWithCar },
  ];

  const colors = ["#22c55e", "#ef4444"];

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
          <XAxis
            dataKey="name"
            tick={{ fill: "#a3a3a3", fontSize: 13 }}
            axisLine={{ stroke: "#404040" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#a3a3a3", fontSize: 12 }}
            axisLine={{ stroke: "#404040" }}
            tickLine={false}
            tickFormatter={formatCurrency}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
          />
          <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={80}>
            {data.map((_, index) => (
              <Cell key={index} fill={colors[index]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
