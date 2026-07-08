"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, addMonths, subMonths, parseISO } from "date-fns";
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, PiggyBank, AlertTriangle } from "lucide-react";
import { useUserCollection } from "@/hooks/useUserCollection";
import { useAuth } from "@/hooks/useAuth";
import { addItem, updateItem, deleteItem } from "@/services/db";
import { budgetSchema, type BudgetForm } from "@/lib/schemas";
import { fmtEUR, fmtMonth, monthKey, currentMonthKey, capitalize, cn } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { Button, Card, Field, Input, Select, Progress, EmptyState, Spinner, Badge, CategoryDot } from "@/components/ui/primitives";
import type { Budget, Category, Transaction } from "@/types";

export default function PresupuestosPage() {
  const { user } = useAuth();
  const { data: budgets, loading } = useUserCollection<Budget>("budgets");
  const { data: categories } = useUserCollection<Category>("categories", "name", "asc");
  const { data: txs } = useUserCollection<Transaction>("transactions");

  const [month, setMonth] = useState(currentMonthKey());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const expenseCats = categories.filter((c) => c.type === "expense");

  const rows = useMemo(() => {
    return budgets
      .filter((b) => b.month === month)
      .map((b) => {
        const spent = txs
          .filter((t) => t.type === "expense" && t.categoryId === b.categoryId && monthKey(t.date) === month)
          .reduce((s, t) => s + t.amount, 0);
        return { ...b, spent, cat: catMap.get(b.categoryId) };
      })
      .sort((a, b) => b.spent / b.amount - a.spent / a.amount);
  }, [budgets, txs, catMap, month]);

  const totals = rows.reduce((acc, r) => ({ budgeted: acc.budgeted + r.amount, spent: acc.spent + r.spent }), { budgeted: 0, spent: 0 });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<BudgetForm>({
    resolver: zodResolver(budgetSchema),
    defaultValues: { categoryId: "", month, amount: 0 },
  });

  function openNew() {
    setEditing(null);
    reset({ categoryId: "", month, amount: 0 });
    setOpen(true);
  }

  function openEdit(b: Budget) {
    setEditing(b);
    reset({ categoryId: b.categoryId, month: b.month, amount: b.amount });
    setOpen(true);
  }

  async function onSubmit(data: BudgetForm) {
    if (!user) return;
    const duplicated = budgets.some((b) => b.month === data.month && b.categoryId === data.categoryId && b.id !== editing?.id);
    if (duplicated) {
      alert("Ya existe un presupuesto para esa categoría en ese mes. Edítalo en su lugar.");
      return;
    }
    if (editing) await updateItem(user.uid, "budgets", editing.id, data);
    else await addItem(user.uid, "budgets", data);
    setOpen(false);
  }

  async function remove(b: Budget) {
    if (!user) return;
    if (confirm(`¿Eliminar el presupuesto de «${catMap.get(b.categoryId)?.name ?? "categoría"}»?`)) {
      await deleteItem(user.uid, "budgets", b.id);
    }
  }

  const shiftMonth = (delta: number) =>
    setMonth(format(delta > 0 ? addMonths(parseISO(month + "-01"), 1) : subMonths(parseISO(month + "-01"), 1), "yyyy-MM"));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Presupuestos</h1>
          <p className="text-sm text-muted">Define un límite por categoría y controla el gasto mes a mes.</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4" /> Nuevo presupuesto</Button>
      </div>

      {/* Selector de mes */}
      <div className="flex items-center justify-between rounded-xl2 border border-line bg-surface px-4 py-3">
        <button onClick={() => shiftMonth(-1)} aria-label="Mes anterior" className="rounded-lg p-1.5 text-muted hover:bg-raised hover:text-ink"><ChevronLeft className="h-5 w-5" /></button>
        <p className="font-display text-base font-bold">{capitalize(fmtMonth(month))}</p>
        <button onClick={() => shiftMonth(1)} aria-label="Mes siguiente" className="rounded-lg p-1.5 text-muted hover:bg-raised hover:text-ink"><ChevronRight className="h-5 w-5" /></button>
      </div>

      {rows.length > 0 && (
        <Card className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">Total presupuestado</p>
          <p className="tabular text-sm">
            <span className={cn("font-bold", totals.spent > totals.budgeted ? "text-expense" : "text-ink")}>{fmtEUR(totals.spent)}</span>
            <span className="text-muted"> de {fmtEUR(totals.budgeted)}</span>
          </p>
        </Card>
      )}

      {loading ? (
        <div className="grid place-items-center py-16"><Spinner label="Cargando presupuestos…" /></div>
      ) : rows.length === 0 ? (
        <EmptyState icon={<PiggyBank className="h-8 w-8" />} title={`Sin presupuestos en ${fmtMonth(month)}`} hint="Crea un presupuesto por categoría para vigilar el gasto de este mes." action={<Button onClick={openNew}><Plus className="h-4 w-4" /> Crear presupuesto</Button>} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map((r) => {
            const pct = (r.spent / r.amount) * 100;
            const over = r.spent > r.amount;
            const remaining = r.amount - r.spent;
            return (
              <Card key={r.id} className={cn("space-y-3", over && "border-expense/50")}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <CategoryDot color={r.cat?.color ?? "#8C948C"} className="h-3 w-3" />
                    <p className="font-semibold">{r.cat?.name ?? "Categoría eliminada"}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(r)} aria-label="Editar presupuesto" className="rounded-lg p-1.5 text-muted hover:bg-raised hover:text-ink"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => remove(r)} aria-label="Eliminar presupuesto" className="rounded-lg p-1.5 text-muted hover:bg-expense/10 hover:text-expense"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                <Progress value={pct} color={r.cat?.color} over={over} />
                <div className="flex items-center justify-between text-sm">
                  <span className="tabular text-muted">{fmtEUR(r.spent)} de {fmtEUR(r.amount)}</span>
                  {over ? (
                    <Badge tone="expense"><AlertTriangle className="h-3 w-3" /> Excedido en {fmtEUR(Math.abs(remaining))}</Badge>
                  ) : (
                    <span className="tabular font-semibold text-income">Quedan {fmtEUR(remaining)}</span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Editar presupuesto" : "Nuevo presupuesto"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Categoría de gasto" htmlFor="b-cat" error={errors.categoryId?.message}>
            <Select id="b-cat" {...register("categoryId")}>
              <option value="">Elegir…</option>
              {expenseCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Mes" htmlFor="b-month" error={errors.month?.message}>
              <Input id="b-month" type="month" {...register("month")} />
            </Field>
            <Field label="Límite (€)" htmlFor="b-amount" error={errors.amount?.message}>
              <Input id="b-amount" type="number" step="0.01" min="0" inputMode="decimal" {...register("amount")} />
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting}>{editing ? "Guardar cambios" : "Crear presupuesto"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
