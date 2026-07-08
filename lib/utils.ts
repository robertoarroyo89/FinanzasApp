import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const eur = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

export function fmtEUR(n: number) {
  return eur.format(n);
}

export function fmtEURSigned(n: number, type: "income" | "expense") {
  return `${type === "income" ? "+" : "−"}${eur.format(Math.abs(n))}`;
}

export function todayISO() {
  return format(new Date(), "yyyy-MM-dd");
}

export function monthKey(dateISO: string) {
  return dateISO.slice(0, 7); // YYYY-MM
}

export function currentMonthKey() {
  return format(new Date(), "yyyy-MM");
}

export function fmtDate(dateISO: string) {
  return format(parseISO(dateISO), "d MMM yyyy", { locale: es });
}

export function fmtMonth(monthISO: string) {
  return format(parseISO(monthISO + "-01"), "MMMM yyyy", { locale: es });
}

export function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
