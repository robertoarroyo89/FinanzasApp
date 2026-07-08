import type { TxType } from "@/types";

export const PAYMENT_METHODS = [
  "Tarjeta",
  "Efectivo",
  "Transferencia",
  "Bizum",
  "Domiciliación",
  "Otro",
] as const;

export const DEFAULT_CATEGORIES: { name: string; color: string; type: TxType }[] = [
  // Gastos
  { name: "Alimentación", color: "#5FA36B", type: "expense" },
  { name: "Transporte", color: "#4E7FB0", type: "expense" },
  { name: "Alquiler", color: "#8A6FB8", type: "expense" },
  { name: "Suministros", color: "#C98A3D", type: "expense" },
  { name: "Ocio", color: "#C95D8A", type: "expense" },
  { name: "Salud", color: "#4FA8A0", type: "expense" },
  { name: "Compras", color: "#B0684E", type: "expense" },
  { name: "Suscripciones", color: "#6B7FC9", type: "expense" },
  { name: "Educación", color: "#7FA34D", type: "expense" },
  { name: "Deudas", color: "#A34D4D", type: "expense" },
  { name: "Otros gastos", color: "#8C948C", type: "expense" },
  // Ingresos
  { name: "Nómina", color: "#2E8B63", type: "income" },
  { name: "Freelance", color: "#3D9C7A", type: "income" },
  { name: "Inversiones", color: "#B9962F", type: "income" },
  { name: "Regalos", color: "#C97FA8", type: "income" },
  { name: "Reembolsos", color: "#5D9CC9", type: "income" },
  { name: "Otros ingresos", color: "#8C948C", type: "income" },
];

export const FREQUENCY_LABELS: Record<string, string> = {
  weekly: "Semanal",
  monthly: "Mensual",
  yearly: "Anual",
};

export const CATEGORY_COLOR_CHOICES = [
  "#2E8B63", "#5FA36B", "#4E7FB0", "#8A6FB8", "#C98A3D", "#C95D8A",
  "#4FA8A0", "#B0684E", "#6B7FC9", "#7FA34D", "#A34D4D", "#B9962F",
  "#5D9CC9", "#C97FA8", "#8C948C", "#3D6B58",
];
