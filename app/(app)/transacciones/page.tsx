"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, LayoutList, LayoutGrid, Repeat2, Search, ArrowLeftRight } from "lucide-react";
import { useUserCollection } from "@/hooks/useUserCollection";
import { useAuth } from "@/hooks/useAuth";
import { deleteItem } from "@/services/db";
import { fmtDate, fmtEURSigned, cn } from "@/lib/utils";
import { TransactionModal } from "@/components/transactions/TransactionModal";
import { Button, Card, Badge, EmptyState, Spinner, Select, Input, CategoryDot } from "@/components/ui/primitives";
import type { Transaction, Category } from "@/types";

type SortKey = "date" | "amount" | "category";

export default function TransaccionesPage() {
  const { user } = useAuth();
  const { data: txs, loading } = useUserCollection<Transaction>("transactions", "date", "desc");
  const { data: categories } = useUserCollection<Category>("categories", "name", "asc");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [view, setView] = useState<"table" | "cards">("table");

  // Filtros
  const [q, setQ] = useState("");
  const [fType, setFType] = useState<"all" | "income" | "expense">("all");
  const [fCat, setFCat] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState<SortKey>("date");

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const filtered = useMemo(() => {
    let list = txs.filter((t) => {
      if (fType !== "all" && t.type !== fType) return false;
      if (fCat !== "all" && t.categoryId !== fCat) return false;
      if (from && t.date < from) return false;
      if (to && t.date > to) return false;
      if (q && !t.title.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
    if (sort === "amount") list = [...list].sort((a, b) => b.amount - a.amount);
    else if (sort === "category")
      list = [...list].sort((a, b) =>
        (catMap.get(a.categoryId)?.name ?? "").localeCompare(catMap.get(b.categoryId)?.name ?? "", "es")
      );
    return list; // por defecto ya viene ordenado por fecha desc
  }, [txs, fType, fCat, from, to, q, sort, catMap]);

  async function remove(t: Transaction) {
    if (!user) return;
    if (confirm(`¿Eliminar «${t.title}»? Esta acción no se puede deshacer.`)) {
      await deleteItem(user.uid, "transactions", t.id);
    }
  }

  function edit(t: Transaction) {
    setEditing(t);
    setModalOpen(true);
  }

  const total = filtered.reduce((acc, t) => acc + (t.type === "income" ? t.amount : -t.amount), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Transacciones</h1>
          <p className="text-sm text-muted">{filtered.length} movimientos · saldo filtrado: <span className={cn("tabular font-semibold", total >= 0 ? "text-income" : "text-expense")}>{fmtEURSigned(total, total >= 0 ? "income" : "expense")}</span></p>
        </div>
        <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
          <Plus className="h-4 w-4" /> Nueva transacción
        </Button>
      </div>

      {/* Filtros */}
      <Card className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="relative col-span-2 sm:col-span-3 lg:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
          <Input aria-label="Buscar por concepto" placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <Select aria-label="Filtrar por tipo" value={fType} onChange={(e) => setFType(e.target.value as typeof fType)}>
          <option value="all">Todos los tipos</option>
          <option value="income">Ingresos</option>
          <option value="expense">Gastos</option>
        </Select>
        <Select aria-label="Filtrar por categoría" value={fCat} onChange={(e) => setFCat(e.target.value)}>
          <option value="all">Todas las categorías</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Input aria-label="Desde" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input aria-label="Hasta" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </Card>

      <div className="flex items-center justify-between gap-3">
        <Select aria-label="Ordenar por" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="w-auto">
          <option value="date">Ordenar por fecha</option>
          <option value="amount">Ordenar por importe</option>
          <option value="category">Ordenar por categoría</option>
        </Select>
        <div className="flex rounded-xl border border-line p-0.5" role="tablist" aria-label="Vista">
          <button role="tab" aria-selected={view === "table"} onClick={() => setView("table")} aria-label="Vista de tabla" className={cn("rounded-[10px] p-2", view === "table" ? "bg-raised text-ink" : "text-muted")}>
            <LayoutList className="h-4 w-4" />
          </button>
          <button role="tab" aria-selected={view === "cards"} onClick={() => setView("cards")} aria-label="Vista de tarjetas" className={cn("rounded-[10px] p-2", view === "cards" ? "bg-raised text-ink" : "text-muted")}>
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center py-16"><Spinner label="Cargando transacciones…" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<ArrowLeftRight className="h-8 w-8" />}
          title="Sin movimientos"
          hint="Añade tu primera transacción o ajusta los filtros para ver resultados."
          action={<Button onClick={() => { setEditing(null); setModalOpen(true); }}><Plus className="h-4 w-4" /> Añadir transacción</Button>}
        />
      ) : view === "table" ? (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                <th className="px-5 py-3 font-semibold">Concepto</th>
                <th className="px-5 py-3 font-semibold">Categoría</th>
                <th className="px-5 py-3 font-semibold">Fecha</th>
                <th className="px-5 py-3 font-semibold">Método</th>
                <th className="px-5 py-3 text-right font-semibold">Importe</th>
                <th className="px-5 py-3 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const cat = catMap.get(t.categoryId);
                return (
                  <tr key={t.id} className="border-b border-line/60 last:border-0 hover:bg-raised/50">
                    <td className="px-5 py-3.5 font-medium">
                      <span className="flex items-center gap-2">
                        {t.title}
                        {t.isRecurring && <Repeat2 className="h-3.5 w-3.5 text-muted" aria-label="Recurrente" />}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-2 text-muted">
                        <CategoryDot color={cat?.color ?? "#8C948C"} />
                        {cat?.name ?? "Sin categoría"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-muted">{fmtDate(t.date)}</td>
                    <td className="px-5 py-3.5 text-muted">{t.paymentMethod}</td>
                    <td className={cn("tabular px-5 py-3.5 text-right font-semibold", t.type === "income" ? "text-income" : "text-expense")}>
                      {fmtEURSigned(t.amount, t.type)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => edit(t)} aria-label={`Editar ${t.title}`} className="rounded-lg p-1.5 text-muted hover:bg-raised hover:text-ink"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => remove(t)} aria-label={`Eliminar ${t.title}`} className="rounded-lg p-1.5 text-muted hover:bg-expense/10 hover:text-expense"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => {
            const cat = catMap.get(t.categoryId);
            return (
              <Card key={t.id} className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{t.title}</p>
                    <p className="text-xs text-muted">{fmtDate(t.date)} · {t.paymentMethod}</p>
                  </div>
                  <span className={cn("tabular text-base font-bold", t.type === "income" ? "text-income" : "text-expense")}>
                    {fmtEURSigned(t.amount, t.type)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <Badge tone="neutral"><CategoryDot color={cat?.color ?? "#8C948C"} /> {cat?.name ?? "Sin categoría"}</Badge>
                  <div className="flex gap-1">
                    <button onClick={() => edit(t)} aria-label={`Editar ${t.title}`} className="rounded-lg p-1.5 text-muted hover:bg-raised hover:text-ink"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => remove(t)} aria-label={`Eliminar ${t.title}`} className="rounded-lg p-1.5 text-muted hover:bg-expense/10 hover:text-expense"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <TransactionModal open={modalOpen} onClose={() => setModalOpen(false)} categories={categories} editing={editing} />
    </div>
  );
}
