"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, Tags } from "lucide-react";
import { useUserCollection } from "@/hooks/useUserCollection";
import { useAuth } from "@/hooks/useAuth";
import { addItem, updateItem, deleteItem } from "@/services/db";
import { categorySchema, type CategoryForm } from "@/lib/schemas";
import { CATEGORY_COLOR_CHOICES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { Button, Card, CardTitle, Field, Input, EmptyState, Spinner, CategoryDot } from "@/components/ui/primitives";
import type { Category, Transaction } from "@/types";

export default function CategoriasPage() {
  const { user } = useAuth();
  const { data: categories, loading } = useUserCollection<Category>("categories", "name", "asc");
  const { data: txs } = useUserCollection<Transaction>("transactions");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const {
    register, handleSubmit, reset, watch, setValue,
    formState: { errors, isSubmitting },
  } = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", color: CATEGORY_COLOR_CHOICES[0], type: "expense" },
  });
  const color = watch("color");
  const type = watch("type");

  function openNew() {
    setEditing(null);
    reset({ name: "", color: CATEGORY_COLOR_CHOICES[0], type: "expense" });
    setOpen(true);
  }

  function openEdit(c: Category) {
    setEditing(c);
    reset({ name: c.name, color: c.color, type: c.type });
    setOpen(true);
  }

  async function onSubmit(data: CategoryForm) {
    if (!user) return;
    if (editing) await updateItem(user.uid, "categories", editing.id, data);
    else await addItem(user.uid, "categories", { ...data, isDefault: false });
    setOpen(false);
  }

  async function remove(c: Category) {
    if (!user) return;
    const used = txs.filter((t) => t.categoryId === c.id).length;
    const msg = used > 0
      ? `«${c.name}» tiene ${used} transacciones asociadas. Si la eliminas, quedarán «Sin categoría». ¿Continuar?`
      : `¿Eliminar la categoría «${c.name}»?`;
    if (confirm(msg)) await deleteItem(user.uid, "categories", c.id);
  }

  const expenses = categories.filter((c) => c.type === "expense");
  const incomes = categories.filter((c) => c.type === "income");

  function CategoryGrid({ items }: { items: Category[] }) {
    return (
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((c) => {
          const count = txs.filter((t) => t.categoryId === c.id).length;
          return (
            <div key={c.id} className="flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ backgroundColor: c.color + "22" }}>
                  <CategoryDot color={c.color} className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{c.name}</p>
                  <p className="text-xs text-muted">{count} movimientos</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(c)} aria-label={`Editar ${c.name}`} className="rounded-lg p-1.5 text-muted hover:bg-raised hover:text-ink"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => remove(c)} aria-label={`Eliminar ${c.name}`} className="rounded-lg p-1.5 text-muted hover:bg-expense/10 hover:text-expense"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Categorías</h1>
          <p className="text-sm text-muted">Organiza tus movimientos con nombres y colores propios.</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4" /> Nueva categoría</Button>
      </div>

      {loading ? (
        <div className="grid place-items-center py-16"><Spinner label="Cargando categorías…" /></div>
      ) : categories.length === 0 ? (
        <EmptyState icon={<Tags className="h-8 w-8" />} title="Sin categorías" hint="Crea tu primera categoría para clasificar los movimientos." action={<Button onClick={openNew}><Plus className="h-4 w-4" /> Crear categoría</Button>} />
      ) : (
        <>
          <section className="space-y-3">
            <CardTitle>Gastos ({expenses.length})</CardTitle>
            <CategoryGrid items={expenses} />
          </section>
          <section className="space-y-3">
            <CardTitle>Ingresos ({incomes.length})</CardTitle>
            <CategoryGrid items={incomes} />
          </section>
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Editar categoría" : "Nueva categoría"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Tipo de categoría">
            {(["expense", "income"] as const).map((t) => (
              <button key={t} type="button" role="radio" aria-checked={type === t} onClick={() => setValue("type", t)}
                className={cn("rounded-xl border px-3 py-2.5 text-sm font-semibold",
                  type === t ? (t === "income" ? "border-income bg-income/10 text-income" : "border-expense bg-expense/10 text-expense") : "border-line text-muted hover:bg-raised")}>
                {t === "income" ? "Ingreso" : "Gasto"}
              </button>
            ))}
          </div>

          <Field label="Nombre" htmlFor="cat-name" error={errors.name?.message}>
            <Input id="cat-name" placeholder="Ej.: Mascotas" {...register("name")} />
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
            <Button type="submit" loading={isSubmitting}>{editing ? "Guardar cambios" : "Crear categoría"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
