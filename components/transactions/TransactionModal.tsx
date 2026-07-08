"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { transactionSchema, type TransactionForm } from "@/lib/schemas";
import { PAYMENT_METHODS } from "@/lib/constants";
import { todayISO } from "@/lib/utils";
import { addItem, updateItem } from "@/services/db";
import { useAuth } from "@/hooks/useAuth";
import { Modal } from "@/components/ui/Modal";
import { Button, Field, Input, Select, Textarea } from "@/components/ui/primitives";
import type { Category, Transaction } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  editing?: Transaction | null;
}

const EMPTY: TransactionForm = {
  title: "",
  amount: 0,
  type: "expense",
  categoryId: "",
  date: todayISO(),
  paymentMethod: "Tarjeta",
  notes: "",
  isRecurring: false,
};

export function TransactionModal({ open, onClose, categories, editing }: Props) {
  const { user } = useAuth();
  const {
    register, handleSubmit, reset, watch, setValue,
    formState: { errors, isSubmitting },
  } = useForm<TransactionForm>({ resolver: zodResolver(transactionSchema), defaultValues: EMPTY });

  const type = watch("type");
  const catOptions = categories.filter((c) => c.type === type);

  useEffect(() => {
    if (open) reset(editing ? { ...editing, notes: editing.notes ?? "" } : EMPTY);
  }, [open, editing, reset]);

  // Si cambia el tipo, evita dejar una categoría del tipo contrario seleccionada
  useEffect(() => {
    const current = watch("categoryId");
    if (current && !catOptions.some((c) => c.id === current)) setValue("categoryId", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  async function onSubmit(data: TransactionForm) {
    if (!user) return;
    const payload = { ...data, notes: data.notes || "" };
    if (editing) await updateItem(user.uid, "transactions", editing.id, payload);
    else await addItem(user.uid, "transactions", payload);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Editar transacción" : "Nueva transacción"}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Selector de tipo */}
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Tipo de transacción">
          {(["expense", "income"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={type === t}
              onClick={() => setValue("type", t)}
              className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
                type === t
                  ? t === "income"
                    ? "border-income bg-income/10 text-income"
                    : "border-expense bg-expense/10 text-expense"
                  : "border-line text-muted hover:bg-raised"
              }`}
            >
              {t === "income" ? "Ingreso" : "Gasto"}
            </button>
          ))}
        </div>

        <Field label="Concepto" htmlFor="tx-title" error={errors.title?.message}>
          <Input id="tx-title" placeholder="Ej.: Compra semanal" {...register("title")} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Importe (€)" htmlFor="tx-amount" error={errors.amount?.message}>
            <Input id="tx-amount" type="number" step="0.01" min="0" inputMode="decimal" placeholder="0,00" {...register("amount")} />
          </Field>
          <Field label="Fecha" htmlFor="tx-date" error={errors.date?.message}>
            <Input id="tx-date" type="date" {...register("date")} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Categoría" htmlFor="tx-cat" error={errors.categoryId?.message}>
            <Select id="tx-cat" {...register("categoryId")}>
              <option value="">Elegir…</option>
              {catOptions.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Método de pago" htmlFor="tx-method" error={errors.paymentMethod?.message}>
            <Select id="tx-method" {...register("paymentMethod")}>
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </Select>
          </Field>
        </div>

        <Field label="Notas (opcional)" htmlFor="tx-notes" error={errors.notes?.message}>
          <Textarea id="tx-notes" placeholder="Detalles adicionales…" {...register("notes")} />
        </Field>

        <label className="flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" className="h-4 w-4 accent-[rgb(var(--primary))]" {...register("isRecurring")} />
          Marcar como recurrente
        </label>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={isSubmitting}>{editing ? "Guardar cambios" : "Añadir transacción"}</Button>
        </div>
      </form>
    </Modal>
  );
}
