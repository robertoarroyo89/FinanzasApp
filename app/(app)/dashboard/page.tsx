"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, TrendingUp, TrendingDown, Wallet, PiggyBank, ArrowRight, Repeat2 } from "lucide-react";
import { useUserCollection } from "@/hooks/useUserCollection";
import { useProfile } from "@/hooks/useProfile";
import { fmtEUR, fmtEURSigned, fmtDate, monthKey, currentMonthKey, capitalize, cn } from "@/lib/utils";
import { Card, CardTitle, Button, Progress, Spinner, EmptyState, CategoryDot } from "@/components/ui/primitives";
import { CashflowChart, CategoryDonut, type MonthPoint, type CategorySlice } from "@/components/dashboard/Charts";
import { TransactionModal } from "@/components/transactions/TransactionModal";
import type { Transaction, Category, Budget } from "@/types";

export default function DashboardPage() {
  const profile = useProfile();
  const { data: txs, loading } = useUserCollection<Transaction>("transactions", "date", "desc");
  const { data: categories } = useUserCollection<Category>("categories", "name", "asc");
  const { data: budgets } = useUserCollection<Budget>("budgets");
  const [modalOpen, setModalOpen] = useState(false);

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const thisMonth = currentMonthKey();
  const prevMonth = format(subMonths(new Date(), 1), "yyyy-MM");

  const stats = useMemo(() => {
    let balance = 0, inMonth = 0, outMonth = 0, inPrev = 0, outPrev = 0;
    for (const t of txs) {
      const signed = t.type === "income" ? t.amount : -t.amount;
      balance += signed;
      const mk = monthKey(t.date);
      if (mk === thisMonth) t.type === "income" ? (inMonth += t.amount) : (outMonth += t.amount);
      if (mk === prevMonth) t.type === "income" ? (inPrev += t.amount) : (outPrev += t.amount);
    }
    const net = inMonth - outMonth;
    const netPrev = inPrev - outPrev;
    return { balance, inMonth, outMonth, net, netPrev };
  }, [txs, thisMonth, prevMonth]);

  const cashflow: MonthPoint[] = useMemo(() => {
    const points: MonthPoint[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const key = format(d, "yyyy-MM");
      const label = capitalize(format(d, "MMM", { locale: es }));
      let ingresos = 0, gastos = 0;
      for (const t of txs) {
        if (monthKey(t.date) !== key) continue;
        t.type === "income" ? (ingresos += t.amount) : (gastos += t.amount);
      }
      points.push({ label, ingresos, gastos });
    }
    return points;
  }, [txs]);

  const byCategory: CategorySlice[] = useMemo(() => {
    const acc = new Map<string, number>();
    for (const t of txs) {
      if (t.type !== "expense" || monthKey(t.date) !== thisMonth) continue;
      acc.set(t.categoryId, (acc.get(t.categoryId) ?? 0) + t.amount);
    }
    return [...acc.entries()]
      .map(([id, value]) => ({ name: catMap.get(id)?.name ?? "Sin categoría", value, color: catMap.get(id)?.color ?? "#8C948C" }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);
  }, [txs, catMap, thisMonth]);

  const monthBudgets = useMemo(() => {
    return budgets
      .filter((b) => b.month === thisMonth)
      .map((b) => {
        const spent = txs
          .filter((t) => t.type === "expense" && t.categoryId === b.categoryId && monthKey(t.date) === thisMonth)
          .reduce((s, t) => s + t.amount, 0);
        return { ...b, spent, cat: catMap.get(b.categoryId) };
      })
      .sort((a, b) => b.spent / b.amount - a.spent / a.amount);
  }, [budgets, txs, catMap, thisMonth]);

  const recent = txs.slice(0, 6);
  const netDelta = stats.net - stats.netPrev;

  if (loading) {
    return <div className="grid place-items-center py-24"><Spinner label="Preparando tu panel…" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted">Hola{profile?.displayName ? `, ${profile.displayName.split(" ")[0]}` : ""} 👋</p>
          <h1 className="font-display text-2xl font-extrabold">Tu panel de {format(new Date(), "MMMM", { locale: es })}</h1>
        </div>
        <Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> Nueva transacción</Button>
      </div>

      {/* Héroe: balance total */}
      <Card className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-primary/10" aria-hidden />
        <CardTitle>Balance total</CardTitle>
        <p className={cn("tabular mt-2 font-display text-5xl font-extrabold tracking-tight sm:text-6xl", stats.balance < 0 && "text-expense")}>
          {fmtEUR(stats.balance)}
        </p>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
          Flujo neto de este mes:
          <span className={cn("tabular font-semibold", stats.net >= 0 ? "text-income" : "text-expense")}>
            {fmtEURSigned(stats.net, stats.net >= 0 ? "income" : "expense")}
          </span>
          <span className={cn("tabular", netDelta >= 0 ? "text-income" : "text-expense")}>
            ({netDelta >= 0 ? "+" : "−"}{fmtEUR(Math.abs(netDelta)).replace("€", "€ ")}vs. mes anterior)
          </span>
        </p>
      </Card>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <div className="flex items-center gap-2 text-income"><TrendingUp className="h-4 w-4" /><CardTitle className="text-income/80">Ingresos del mes</CardTitle></div>
          <p className="tabular mt-2 text-2xl font-bold">{fmtEUR(stats.inMonth)}</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-expense"><TrendingDown className="h-4 w-4" /><CardTitle className="text-expense/80">Gastos del mes</CardTitle></div>
          <p className="tabular mt-2 text-2xl font-bold">{fmtEUR(stats.outMonth)}</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-primary"><PiggyBank className="h-4 w-4" /><CardTitle className="text-primary/80">Ahorro del mes</CardTitle></div>
          <p className={cn("tabular mt-2 text-2xl font-bold", stats.net < 0 && "text-expense")}>{fmtEUR(Math.max(stats.net, 0))}</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-gold"><Wallet className="h-4 w-4" /><CardTitle className="text-gold/80">Tasa de ahorro</CardTitle></div>
          <p className="tabular mt-2 text-2xl font-bold">
            {stats.inMonth > 0 ? `${Math.max(0, Math.round((stats.net / stats.inMonth) * 100))} %` : "—"}
          </p>
        </Card>
      </div>

      {/* Gráficas */}
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardTitle>Ingresos vs. gastos (últimos 6 meses)</CardTitle>
          <div className="mt-4"><CashflowChart data={cashflow} /></div>
        </Card>
        <Card className="lg:col-span-2">
          <CardTitle>Gasto por categoría (este mes)</CardTitle>
          {byCategory.length === 0 ? (
            <p className="mt-6 text-sm text-muted">Aún no hay gastos este mes.</p>
          ) : (
            <>
              <div className="mt-2"><CategoryDonut data={byCategory} /></div>
              <ul className="mt-1 space-y-1.5">
                {byCategory.slice(0, 5).map((s) => (
                  <li key={s.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted"><CategoryDot color={s.color} />{s.name}</span>
                    <span className="tabular font-semibold">{fmtEUR(s.value)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </div>

      {/* Presupuestos + recientes */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <CardTitle>Presupuestos del mes</CardTitle>
            <Link href="/presupuestos" className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">Ver todos <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          {monthBudgets.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No has definido presupuestos para este mes. <Link href="/presupuestos" className="font-semibold text-primary hover:underline">Crea el primero</Link>.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {monthBudgets.slice(0, 4).map((b) => {
                const pct = (b.spent / b.amount) * 100;
                const over = b.spent > b.amount;
                return (
                  <li key={b.id}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 font-medium"><CategoryDot color={b.cat?.color ?? "#8C948C"} />{b.cat?.name ?? "Categoría"}</span>
                      <span className={cn("tabular text-muted", over && "font-semibold text-expense")}>
                        {fmtEUR(b.spent)} / {fmtEUR(b.amount)}
                      </span>
                    </div>
                    <Progress value={pct} color={b.cat?.color} over={over} />
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <CardTitle>Movimientos recientes</CardTitle>
            <Link href="/transacciones" className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">Ver todos <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          {recent.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="Todavía no hay movimientos" hint="Añade tu primera transacción para empezar a ver datos." action={<Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> Añadir</Button>} />
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-line/60">
              {recent.map((t) => {
                const cat = catMap.get(t.categoryId);
                return (
                  <li key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                        {t.title}
                        {t.isRecurring && <Repeat2 className="h-3.5 w-3.5 shrink-0 text-muted" aria-label="Recurrente" />}
                      </p>
                      <p className="flex items-center gap-1.5 text-xs text-muted"><CategoryDot color={cat?.color ?? "#8C948C"} className="h-2 w-2" />{cat?.name ?? "Sin categoría"} · {fmtDate(t.date)}</p>
                    </div>
                    <span className={cn("tabular shrink-0 text-sm font-semibold", t.type === "income" ? "text-income" : "text-expense")}>
                      {fmtEURSigned(t.amount, t.type)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <TransactionModal open={modalOpen} onClose={() => setModalOpen(false)} categories={categories} />
    </div>
  );
}
