import { z } from "zod";

export const transactionSchema = z.object({
  title: z.string().min(2, "Mínimo 2 caracteres").max(80, "Máximo 80 caracteres"),
  amount: z.coerce.number().positive("Debe ser mayor que 0"),
  type: z.enum(["income", "expense"]),
  categoryId: z.string().min(1, "Elige una categoría"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha no válida"),
  paymentMethod: z.string().min(1, "Elige un método de pago"),
  notes: z.string().max(300, "Máximo 300 caracteres").optional().or(z.literal("")),
  isRecurring: z.boolean().optional(),
});
export type TransactionForm = z.infer<typeof transactionSchema>;

export const categorySchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres").max(40, "Máximo 40 caracteres"),
  color: z.string().regex(/^#([0-9a-fA-F]{6})$/, "Color no válido"),
  type: z.enum(["income", "expense"]),
});
export type CategoryForm = z.infer<typeof categorySchema>;

export const budgetSchema = z.object({
  categoryId: z.string().min(1, "Elige una categoría"),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Mes no válido"),
  amount: z.coerce.number().positive("Debe ser mayor que 0"),
});
export type BudgetForm = z.infer<typeof budgetSchema>;

export const goalSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres").max(60, "Máximo 60 caracteres"),
  target: z.coerce.number().positive("Debe ser mayor que 0"),
  saved: z.coerce.number().min(0, "No puede ser negativo"),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha no válida"),
  color: z.string().regex(/^#([0-9a-fA-F]{6})$/, "Color no válido"),
});
export type GoalForm = z.infer<typeof goalSchema>;

export const recurringSchema = z.object({
  title: z.string().min(2, "Mínimo 2 caracteres").max(80, "Máximo 80 caracteres"),
  amount: z.coerce.number().positive("Debe ser mayor que 0"),
  type: z.enum(["income", "expense"]),
  categoryId: z.string().min(1, "Elige una categoría"),
  paymentMethod: z.string().min(1, "Elige un método de pago"),
  frequency: z.enum(["weekly", "monthly", "yearly"]),
  nextRun: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha no válida"),
  active: z.boolean(),
});
export type RecurringForm = z.infer<typeof recurringSchema>;

export const profileSchema = z.object({
  displayName: z.string().min(2, "Mínimo 2 caracteres").max(60, "Máximo 60 caracteres"),
});
export type ProfileForm = z.infer<typeof profileSchema>;
