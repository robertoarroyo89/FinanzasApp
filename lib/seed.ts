import { getDocs, writeBatch, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { userCol } from "@/services/db";
import { format, subMonths, addMonths, setDate } from "date-fns";
import type { Category } from "@/types";

/**
 * Genera datos de demostración realistas: ~3 meses de transacciones,
 * presupuestos del mes actual, 2 metas de ahorro y 2 reglas recurrentes.
 * Todo lo creado lleva demo: true para poder eliminarlo después.
 */
export async function seedDemoData(uid: string) {
  const catsSnap = await getDocs(userCol(uid, "categories"));
  const cats = catsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Category));
  const byName = (name: string) => cats.find((c) => c.name === name)?.id ?? cats[0].id;

  const now = new Date();
  const d = (monthsAgo: number, day: number) =>
    format(setDate(subMonths(now, monthsAgo), day), "yyyy-MM-dd");

  const txs: Array<Record<string, unknown>> = [];
  for (let m = 2; m >= 0; m--) {
    txs.push(
      { title: "Nómina", amount: 2150, type: "income", categoryId: byName("Nómina"), date: d(m, 1), paymentMethod: "Transferencia", isRecurring: true },
      { title: "Proyecto freelance", amount: 380 + m * 60, type: "income", categoryId: byName("Freelance"), date: d(m, 14), paymentMethod: "Transferencia" },
      { title: "Alquiler piso", amount: 850, type: "expense", categoryId: byName("Alquiler"), date: d(m, 2), paymentMethod: "Domiciliación", isRecurring: true },
      { title: "Compra Mercadona", amount: 92.4 + m * 8, type: "expense", categoryId: byName("Alimentación"), date: d(m, 5), paymentMethod: "Tarjeta" },
      { title: "Compra Consum", amount: 64.1, type: "expense", categoryId: byName("Alimentación"), date: d(m, 12), paymentMethod: "Tarjeta" },
      { title: "Compra semanal", amount: 78.35, type: "expense", categoryId: byName("Alimentación"), date: d(m, 20), paymentMethod: "Tarjeta" },
      { title: "Luz y agua", amount: 96.2 + m * 5, type: "expense", categoryId: byName("Suministros"), date: d(m, 8), paymentMethod: "Domiciliación" },
      { title: "Gasolina", amount: 55, type: "expense", categoryId: byName("Transporte"), date: d(m, 10), paymentMethod: "Tarjeta" },
      { title: "Netflix + Spotify", amount: 25.98, type: "expense", categoryId: byName("Suscripciones"), date: d(m, 3), paymentMethod: "Tarjeta", isRecurring: true },
      { title: "Cena con amigos", amount: 42.5 + m * 4, type: "expense", categoryId: byName("Ocio"), date: d(m, 17), paymentMethod: "Bizum" },
      { title: "Farmacia", amount: 18.6, type: "expense", categoryId: byName("Salud"), date: d(m, 22), paymentMethod: "Efectivo" },
      { title: "Ropa", amount: 59.99, type: "expense", categoryId: byName("Compras"), date: d(m, 25), paymentMethod: "Tarjeta" },
    );
  }

  const currentMonth = format(now, "yyyy-MM");
  const budgets = [
    { categoryId: byName("Alimentación"), month: currentMonth, amount: 300 },
    { categoryId: byName("Ocio"), month: currentMonth, amount: 120 },
    { categoryId: byName("Transporte"), month: currentMonth, amount: 100 },
    { categoryId: byName("Compras"), month: currentMonth, amount: 80 },
  ];

  const goals = [
    { name: "Fondo de emergencia", target: 6000, saved: 2450, deadline: format(addMonths(now, 10), "yyyy-MM-dd"), color: "#2E8B63" },
    { name: "Viaje a Japón", target: 3200, saved: 780, deadline: format(addMonths(now, 14), "yyyy-MM-dd"), color: "#4E7FB0" },
  ];

  const recurring = [
    { title: "Nómina", amount: 2150, type: "income", categoryId: byName("Nómina"), paymentMethod: "Transferencia", frequency: "monthly", nextRun: format(setDate(addMonths(now, 1), 1), "yyyy-MM-dd"), active: true },
    { title: "Alquiler piso", amount: 850, type: "expense", categoryId: byName("Alquiler"), paymentMethod: "Domiciliación", frequency: "monthly", nextRun: format(setDate(addMonths(now, 1), 2), "yyyy-MM-dd"), active: true },
  ];

  const batch = writeBatch(db);
  const stamp = { demo: true, createdAt: serverTimestamp() };
  txs.forEach((t) => batch.set(doc(userCol(uid, "transactions")), { ...t, ...stamp }));
  budgets.forEach((b) => batch.set(doc(userCol(uid, "budgets")), { ...b, ...stamp }));
  goals.forEach((g) => batch.set(doc(userCol(uid, "savingsGoals")), { ...g, ...stamp }));
  recurring.forEach((r) => batch.set(doc(userCol(uid, "recurring")), { ...r, ...stamp }));
  await batch.commit();
}
