"use client";

import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";
import { fmtEUR } from "@/lib/utils";

const tooltipStyle = {
  backgroundColor: "rgb(var(--surface))",
  border: "1px solid rgb(var(--line))",
  borderRadius: 12,
  color: "rgb(var(--ink))",
  fontSize: 13,
};

export interface MonthPoint { label: string; ingresos: number; gastos: number }

export function CashflowChart({ data }: { data: MonthPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gIn" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(var(--income))" stopOpacity={0.35} />
            <stop offset="100%" stopColor="rgb(var(--income))" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gOut" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(var(--expense))" stopOpacity={0.3} />
            <stop offset="100%" stopColor="rgb(var(--expense))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--line))" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: "rgb(var(--muted))", fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "rgb(var(--muted))", fontSize: 12 }} axisLine={false} tickLine={false} width={60} tickFormatter={(v) => `${v} €`} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => [fmtEUR(v), name === "ingresos" ? "Ingresos" : "Gastos"]} />
        <Area type="monotone" dataKey="ingresos" stroke="rgb(var(--income))" strokeWidth={2.5} fill="url(#gIn)" />
        <Area type="monotone" dataKey="gastos" stroke="rgb(var(--expense))" strokeWidth={2.5} fill="url(#gOut)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export interface CategorySlice { name: string; value: number; color: string }

export function CategoryDonut({ data }: { data: CategorySlice[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={3} strokeWidth={0}>
          {data.map((s) => <Cell key={s.name} fill={s.color} />)}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtEUR(v)} />
      </PieChart>
    </ResponsiveContainer>
  );
}
