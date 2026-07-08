"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Trophy, PiggyBank, Receipt } from "lucide-react";
import { useUserCollection } from "@/hooks/useUserCollection";
import type { Transaction, Category } from "@/types";
import { Card, CardTitle, Spinner, EmptyState, Badge, CategoryDot } from "@/components/ui/primitives";
import { fmtEUR, fmtDate } from "@/lib/utils";

const MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export default function InformesPage() {
  const { data: txs, loading } = useUserCollection<Transaction>("transactions", "date");
  const { data: cats } = useUserCollection<Category>("categories");
  const [year, setYear] = useState(() => new Date().getFullYear());

  const catById = useMemo(() => new Map(cats.map((c) => [c.id, c])), [cats]);

  const yearTxs = useMemo(
    () => txs.filter((t) => t.date.startsWith(String(year))),
    [txs, year]
  );

  const monthly = useMemo(() => {
    const rows = MONTH_LABELS.map((label) => ({ label, ingresos: 0, gastos: 0 }));
    for (const t of yearTxs) {
      const m = Number(t.date.slice(5, 7)) - 1;
      if (m < 0 || m > 11) continue;
      if (t.type === "income") rows[m].ingresos += t.amount;
      else rows[m].gastos += t.amount;
    }
    return rows;
  }, [yearTxs]);

  const totals = useMemo(() => {
    const income = yearTxs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = yearTxs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return { income, expense, net: income - expense };
  }, [yearTxs]);

  const insights = useMemo(() => {
    const expenses = yearTxs.filter((t) => t.type === "expense");

    // Categoría con más gasto
    const byCat = new Map<string, number>();
    for (const t of expenses) byCat.set(t.categoryId, (byCat.get(t.categoryId) ?? 0) + t.amount);
    let topCat: { id: string; total: number } | null = null;
    for (const [id, total] of byCat) {
      if (!topCat || total > topCat.total) topCat = { id, total };
    }

    // Mayor gasto individual
    let biggest: Transaction | null = null;
    for (const t of expenses) {
      if (!biggest || t.amount > biggest.amount) biggest = t;
    }

    // Ahorro medio mensual (solo meses con actividad)
    const activeMonths = monthly.filter((m) => m.ingresos > 0 || m.gastos > 0);
    const avgSavings =
      activeMonths.length > 0
        ? activeMonths.reduce((s, m) => s + (m.ingresos - m.gastos), 0) / activeMonths.length
        : 0;

    // Tendencia de ahorro: segunda mitad de meses activos vs primera
    let trend: "up" | "down" | "flat" = "flat";
    if (activeMonths.length >= 2) {
      const half = Math.floor(activeMonths.length / 2);
      const first = activeMonths.slice(0, half).reduce((s, m) => s + (m.ingresos - m.gastos), 0) / half;
      const second =
        activeMonths.slice(half).reduce((s, m) => s + (m.ingresos - m.gastos), 0) /
        (activeMonths.length - half);
      if (second > first * 1.05) trend = "up";
      else if (second < first * 0.95) trend = "down";
    }

    return { topCat, biggest, avgSavings, trend, activeMonths: activeMonths.length };
  }, [yearTxs, monthly]);

  if (loading) return <Spinner label="Cargando informes…" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Informes</h1>
          <p className="text-sm text-muted">Resumen anual y tendencias de tu dinero.</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl2 border border-line bg-surface px-2 py-1.5">
          <button
            onClick={() => setYear((y) => y - 1)}
            className="rounded-lg p-1.5 text-muted hover:bg-raised hover:text-ink"
            aria-label="Año anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[4ch] text-center font-display text-sm font-semibold text-ink tabular">
            {year}
          </span>
          <button
            onClick={() => setYear((y) => y + 1)}
            className="rounded-lg p-1.5 text-muted hover:bg-raised hover:text-ink"
            aria-label="Año siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {yearTxs.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Receipt className="h-8 w-8" />}
            title={`Sin movimientos en ${year}`}
            hint="Cuando registres transacciones en este año, aquí verás su análisis."
          />
        </Card>
      ) : (
        <>
          {/* Totales del año */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Ingresos {year}</p>
              <p className="mt-1 font-display text-2xl font-bold text-income tabular">{fmtEUR(totals.income)}</p>
            </Card>
            <Card>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Gastos {year}</p>
              <p className="mt-1 font-display text-2xl font-bold text-expense tabular">{fmtEUR(totals.expense)}</p>
            </Card>
            <Card>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Ahorro neto {year}</p>
              <p className={`mt-1 font-display text-2xl font-bold tabular ${totals.net >= 0 ? "text-income" : "text-expense"}`}>
                {fmtEUR(totals.net)}
              </p>
            </Card>
          </div>

          {/* Barras mensuales */}
          <Card>
            <CardTitle>Ingresos vs gastos por mes</CardTitle>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--line))" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "rgb(var(--muted))", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fill: "rgb(var(--muted))", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [fmtEUR(value), name === "ingresos" ? "Ingresos" : "Gastos"]}
                    contentStyle={{
                      background: "rgb(var(--surface))",
                      border: "1px solid rgb(var(--line))",
                      borderRadius: 12,
                      color: "rgb(var(--ink))",
                      fontSize: 13,
                    }}
                    cursor={{ fill: "rgb(var(--raised))" }}
                  />
                  <Legend
                    formatter={(v: string) => (
                      <span style={{ color: "rgb(var(--muted))", fontSize: 12 }}>
                        {v === "ingresos" ? "Ingresos" : "Gastos"}
                      </span>
                    )}
                  />
                  <Bar dataKey="ingresos" fill="rgb(var(--income))" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="gastos" fill="rgb(var(--expense))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Insights */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <div className="flex items-center gap-2 text-muted">
                <Trophy className="h-4 w-4" />
                <p className="text-xs font-medium uppercase tracking-wide">Categoría con más gasto</p>
              </div>
              {insights.topCat ? (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <CategoryDot color={catById.get(insights.topCat.id)?.color ?? "#999"} />
                    <p className="font-display text-lg font-semibold text-ink">
                      {catById.get(insights.topCat.id)?.name ?? "Sin categoría"}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-muted tabular">{fmtEUR(insights.topCat.total)} en el año</p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted">Sin gastos registrados.</p>
              )}
            </Card>

            <Card>
              <div className="flex items-center gap-2 text-muted">
                <Receipt className="h-4 w-4" />
                <p className="text-xs font-medium uppercase tracking-wide">Mayor gasto individual</p>
              </div>
              {insights.biggest ? (
                <div className="mt-2">
                  <p className="font-display text-lg font-semibold text-ink">{insights.biggest.title}</p>
                  <p className="mt-1 text-sm text-muted tabular">
                    {fmtEUR(insights.biggest.amount)} · {fmtDate(insights.biggest.date)}
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted">Sin gastos registrados.</p>
              )}
            </Card>

            <Card>
              <div className="flex items-center gap-2 text-muted">
                <PiggyBank className="h-4 w-4" />
                <p className="text-xs font-medium uppercase tracking-wide">Ahorro medio mensual</p>
              </div>
              <p className={`mt-2 font-display text-lg font-semibold tabular ${insights.avgSavings >= 0 ? "text-income" : "text-expense"}`}>
                {fmtEUR(insights.avgSavings)}
              </p>
              <p className="mt-1 text-sm text-muted">
                Sobre {insights.activeMonths} {insights.activeMonths === 1 ? "mes" : "meses"} con actividad.
              </p>
            </Card>

            <Card>
              <div className="flex items-center gap-2 text-muted">
                {insights.trend === "down" ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                <p className="text-xs font-medium uppercase tracking-wide">Tendencia de ahorro</p>
              </div>
              <div className="mt-2">
                {insights.trend === "up" && <Badge tone="income">Mejorando</Badge>}
                {insights.trend === "down" && <Badge tone="expense">Empeorando</Badge>}
                {insights.trend === "flat" && <Badge tone="neutral">Estable</Badge>}
              </div>
              <p className="mt-2 text-sm text-muted">
                {insights.trend === "up" && "Tu ahorro mensual va al alza en la segunda parte del año."}
                {insights.trend === "down" && "Tu ahorro mensual se está reduciendo. Revisa tus presupuestos."}
                {insights.trend === "flat" && "Tu ritmo de ahorro se mantiene sin cambios significativos."}
              </p>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
