"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, Repeat2, Zap } from "lucide-react";
import { useUserCollection } from "@/hooks/useUserCollection";
import { useAuth } from "@/hooks/useAuth";
import { addItem, updateItem, deleteItem } from "@/services/db";
import { processRecurring } from "@/lib/recurring";
import { recurringSchema, type RecurringForm } from "@/lib/schemas";
import { PAYMENT_METHODS, FREQUENCY_LABELS } from "@/lib/constants";
import { fmtEUR, fmtDate, todayISO, cn } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { Button, Card, Field, Input, Select, EmptyState, Spinner, Badge, CategoryDot } from "@/components/ui/primitives";
import type { RecurringRule, Category } from "@/types";

export default function RecurrentesPage() {
  const { user } = useAuth();
  const { data: rules, loading } = useUserCollection<RecurringRule>("recurring", "nextRun", "asc");
  const { data: categories } = useUserCollection<Category>("categories", "name", "asc");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringRule | null>(null);
  const [generating, setGenerating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<RecurringForm>({
    resolver: zodResolver(recurringSchema),
    defaultValues: { title: "", amount: 0, type: "expense", categoryId: "", paymentMethod: "Domiciliación", frequency: "monthly", nextRun: todayISO(), active: true },
  });
  const type = watch("type");
  const catOptions = categories.filter((c) => c.type === type);

  function openNew() {
    setEditing(null);
    reset({ title: "", amount: 0, type: "expense", categoryId: "", paymentMethod: "Domiciliación", frequency: "monthly", nextRun: todayISO(), active: true });
    setOpen(true);
  }

  function openEdit(r: RecurringRule) {
    setEditing(r);
    reset({ ...r });
    setOpen(true);
  }

  async function onSubmit(data: RecurringForm) {
    if (!user) return;
    if (editing) await updateItem(user.uid, "recurring", editing.id, data);
    else await addItem(user.uid, "recurring", data);
    setOpen(false);
  }

  async function remove(r: RecurringRule) {
    if (!user) return;
    if (confirm(`¿Eliminar la regla «${r.title}»? Las transacciones ya generadas se conservan.`)) {
      await deleteItem(user.uid, "recurring", r.id);
    }
  }

  async function toggleActive(r: RecurringRule) {
    if (!user) return;
    await updateItem(user.uid, "recurring", r.id, { active: !r.active });
  }

  async function generateNow() {
    if (!user) return;
    setGenerating(true);
    setNotice(null);
    try {
      const n = await processRecurring(user.uid);
      setNotice(n > 0 ? `Se han generado ${n} transacciones pendientes.` : "No había transacciones recurrentes pendientes de generar.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Recurrentes</h1>
          <p className="text-sm text-muted">Nóminas, alquiler, suscripciones… se generan solas cuando toca.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={generateNow} loading={generating}><Zap className="h-4 w-4" /> Generar pendientes</Button>
          <Button onClick={openNew}><Plus className="h-4 w-4" /> Nueva regla</Button>
        </div>
      </div>

      {notice && <p className="rounded-xl bg-primary/10 px-3.5 py-2.5 text-sm font-medium text-primary" role="status">{notice}</p>}

      {loading ? (
        <div className="grid place-items-center py-16"><Spinner label="Cargando reglas…" /></div>
      ) : rules.length === 0 ? (
        <EmptyState icon={<Repeat2 className="h-8 w-8" />} title="Sin reglas recurrentes" hint="Crea una regla y la app registrará el movimiento automáticamente en cada ciclo." action={<Button onClick={openNew}><Plus className="h-4 w-4" /> Crear regla</Button>} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {rules.map((r) => {
            const cat = catMap.get(r.categoryId);
            return (
              <Card key={r.id} className={cn("space-y-3", !r.active && "opacity-60")}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{r.title}</p>
                    <p className="flex items-center gap-1.5 text-xs text-muted">
                      <CategoryDot color={cat?.color ?? "#8C948C"} className="h-2 w-2" />
                      {cat?.name ?? "Sin categoría"} · {r.paymentMethod}
                    </p>
                  </div>
                  <span className={cn("tabular text-base font-bold", r.type === "income" ? "text-income" : "text-expense")}>
                    {r.type === "income" ? "+" : "−"}{fmtEUR(r.amount)}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge tone="neutral">{FREQUENCY_LABELS[r.frequency]}</Badge>
                  <Badge tone={r.active ? "income" : "neutral"}>{r.active ? "Activa" : "Pausada"}</Badge>
                  <span className="text-xs text-muted">Próxima: {fmtDate(r.nextRun)}</span>
                </div>
                <div className="flex justify-end gap-1 border-t border-line/60 pt-2">
                  <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => toggleActive(r)}>{r.active ? "Pausar" : "Reanudar"}</Button>
                  <button onClick={() => openEdit(r)} aria-label={`Editar ${r.title}`} className="rounded-lg p-1.5 text-muted hover:bg-raised hover:text-ink"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(r)} aria-label={`Eliminar ${r.title}`} className="rounded-lg p-1.5 text-muted hover:bg-expense/10 hover:text-expense"><Trash2 className="h-4 w-4" /></button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Editar regla recurrente" : "Nueva regla recurrente"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Tipo">
            {(["expense", "income"] as const).map((t) => (
              <button key={t} type="button" role="radio" aria-checked={type === t} onClick={() => setValue("type", t)}
                className={cn("rounded-xl border px-3 py-2.5 text-sm font-semibold",
                  type === t ? (t === "income" ? "border-income bg-income/10 text-income" : "border-expense bg-expense/10 text-expense") : "border-line text-muted hover:bg-raised")}>
                {t === "income" ? "Ingreso" : "Gasto"}
              </button>
            ))}
          </div>
          <Field label="Concepto" htmlFor="r-title" error={errors.title?.message}>
            <Input id="r-title" placeholder="Ej.: Alquiler piso" {...register("title")} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Importe (€)" htmlFor="r-amount" error={errors.amount?.message}>
              <Input id="r-amount" type="number" step="0.01" min="0" inputMode="decimal" {...register("amount")} />
            </Field>
            <Field label="Frecuencia" htmlFor="r-freq" error={errors.frequency?.message}>
              <Select id="r-freq" {...register("frequency")}>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensual</option>
                <option value="yearly">Anual</option>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Categoría" htmlFor="r-cat" error={errors.categoryId?.message}>
              <Select id="r-cat" {...register("categoryId")}>
                <option value="">Elegir…</option>
                {catOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <Field label="Método de pago" htmlFor="r-method" error={errors.paymentMethod?.message}>
              <Select id="r-method" {...register("paymentMethod")}>
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Próxima ejecución" htmlFor="r-next" error={errors.nextRun?.message}>
            <Input id="r-next" type="date" {...register("nextRun")} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" className="h-4 w-4 accent-[rgb(var(--primary))]" {...register("active")} />
            Regla activa
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting}>{editing ? "Guardar cambios" : "Crear regla"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
