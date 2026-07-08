"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { differenceInCalendarMonths, parseISO } from "date-fns";
import { Plus, Pencil, Trash2, Target, CheckCircle2 } from "lucide-react";
import { useUserCollection } from "@/hooks/useUserCollection";
import { useAuth } from "@/hooks/useAuth";
import { addItem, updateItem, deleteItem } from "@/services/db";
import { goalSchema, type GoalForm } from "@/lib/schemas";
import { CATEGORY_COLOR_CHOICES } from "@/lib/constants";
import { fmtEUR, fmtDate, todayISO, cn } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { Button, Card, Field, Input, Progress, EmptyState, Spinner, Badge } from "@/components/ui/primitives";
import type { SavingsGoal } from "@/types";

export default function AhorroPage() {
  const { user } = useAuth();
  const { data: goals, loading } = useUserCollection<SavingsGoal>("savingsGoals", "deadline", "asc");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SavingsGoal | null>(null);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<GoalForm>({
    resolver: zodResolver(goalSchema),
    defaultValues: { name: "", target: 0, saved: 0, deadline: todayISO(), color: CATEGORY_COLOR_CHOICES[0] },
  });
  const color = watch("color");

  function openNew() {
    setEditing(null);
    reset({ name: "", target: 0, saved: 0, deadline: todayISO(), color: CATEGORY_COLOR_CHOICES[0] });
    setOpen(true);
  }

  function openEdit(g: SavingsGoal) {
    setEditing(g);
    reset({ name: g.name, target: g.target, saved: g.saved, deadline: g.deadline, color: g.color });
    setOpen(true);
  }

  async function onSubmit(data: GoalForm) {
    if (!user) return;
    if (editing) await updateItem(user.uid, "savingsGoals", editing.id, data);
    else await addItem(user.uid, "savingsGoals", data);
    setOpen(false);
  }

  async function remove(g: SavingsGoal) {
    if (!user) return;
    if (confirm(`¿Eliminar la meta «${g.name}»?`)) await deleteItem(user.uid, "savingsGoals", g.id);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Metas de ahorro</h1>
          <p className="text-sm text-muted">Ponle nombre, cifra y fecha a lo que quieres conseguir.</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4" /> Nueva meta</Button>
      </div>

      {loading ? (
        <div className="grid place-items-center py-16"><Spinner label="Cargando metas…" /></div>
      ) : goals.length === 0 ? (
        <EmptyState icon={<Target className="h-8 w-8" />} title="Sin metas de ahorro" hint="Crea tu primera meta: un fondo de emergencia es un buen punto de partida." action={<Button onClick={openNew}><Plus className="h-4 w-4" /> Crear meta</Button>} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {goals.map((g) => {
            const pct = g.target > 0 ? (g.saved / g.target) * 100 : 0;
            const done = g.saved >= g.target;
            const remaining = Math.max(0, g.target - g.saved);
            const monthsLeft = Math.max(0, differenceInCalendarMonths(parseISO(g.deadline), new Date()));
            const monthlyNeeded = monthsLeft > 0 ? remaining / monthsLeft : remaining;
            const overdue = !done && g.deadline < todayISO();
            return (
              <Card key={g.id} className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold" style={{ color: g.color }}>{g.name}</p>
                    <p className="text-xs text-muted">Fecha objetivo: {fmtDate(g.deadline)}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(g)} aria-label={`Editar ${g.name}`} className="rounded-lg p-1.5 text-muted hover:bg-raised hover:text-ink"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => remove(g)} aria-label={`Eliminar ${g.name}`} className="rounded-lg p-1.5 text-muted hover:bg-expense/10 hover:text-expense"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                <p className="tabular font-display text-2xl font-extrabold">
                  {fmtEUR(g.saved)} <span className="text-base font-semibold text-muted">/ {fmtEUR(g.target)}</span>
                </p>
                <Progress value={pct} color={g.color} />
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="tabular text-muted">{Math.min(100, Math.round(pct))} % completado</span>
                  {done ? (
                    <Badge tone="income"><CheckCircle2 className="h-3 w-3" /> ¡Conseguido!</Badge>
                  ) : overdue ? (
                    <Badge tone="expense">Fecha superada · faltan {fmtEUR(remaining)}</Badge>
                  ) : (
                    <span className={cn("tabular text-muted")}>
                      Ritmo necesario: <span className="font-semibold text-ink">{fmtEUR(monthlyNeeded)}/mes</span>
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Editar meta" : "Nueva meta de ahorro"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Nombre" htmlFor="g-name" error={errors.name?.message}>
            <Input id="g-name" placeholder="Ej.: Fondo de emergencia" {...register("name")} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Objetivo (€)" htmlFor="g-target" error={errors.target?.message}>
              <Input id="g-target" type="number" step="0.01" min="0" inputMode="decimal" {...register("target")} />
            </Field>
            <Field label="Ahorrado (€)" htmlFor="g-saved" error={errors.saved?.message}>
              <Input id="g-saved" type="number" step="0.01" min="0" inputMode="decimal" {...register("saved")} />
            </Field>
          </div>
          <Field label="Fecha objetivo" htmlFor="g-deadline" error={errors.deadline?.message}>
            <Input id="g-deadline" type="date" {...register("deadline")} />
          </Field>
          <Field label="Color" error={errors.color?.message}>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLOR_CHOICES.map((c) => (
                <button key={c} type="button" onClick={() => setValue("color", c)} aria-label={`Color ${c}`} aria-pressed={color === c}
                  className={cn("h-8 w-8 rounded-full border-2 transition-transform", color === c ? "scale-110 border-ink" : "border-transparent")}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting}>{editing ? "Guardar cambios" : "Crear meta"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
