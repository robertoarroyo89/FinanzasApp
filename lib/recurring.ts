import { getDocs, query, where, writeBatch, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { userCol } from "@/services/db";
import { addWeeks, addMonths, addYears, parseISO, format } from "date-fns";
import { todayISO } from "@/lib/utils";
import type { RecurringRule, Frequency } from "@/types";

function advance(dateISO: string, freq: Frequency): string {
  const d = parseISO(dateISO);
  const next = freq === "weekly" ? addWeeks(d, 1) : freq === "yearly" ? addYears(d, 1) : addMonths(d, 1);
  return format(next, "yyyy-MM-dd");
}

/**
 * Genera automáticamente las transacciones de las reglas recurrentes vencidas
 * (nextRun <= hoy) y avanza nextRun. Se ejecuta al cargar la app.
 */
export async function processRecurring(uid: string) {
  const today = todayISO();
  const q = query(userCol(uid, "recurring"), where("active", "==", true));
  const snap = await getDocs(q);
  const rules = snap.docs.map((d) => ({ id: d.id, ...d.data() } as RecurringRule));
  const due = rules.filter((r) => r.nextRun <= today);
  if (!due.length) return 0;

  const batch = writeBatch(db);
  let created = 0;

  for (const rule of due) {
    let run = rule.nextRun;
    let guard = 0;
    while (run <= today && guard < 24) {
      batch.set(doc(userCol(uid, "transactions")), {
        title: rule.title,
        amount: rule.amount,
        type: rule.type,
        categoryId: rule.categoryId,
        date: run,
        paymentMethod: rule.paymentMethod,
        notes: "Generado automáticamente (recurrente)",
        isRecurring: true,
      });
      created++;
      run = advance(run, rule.frequency);
      guard++;
    }
    batch.update(doc(db, "users", uid, "recurring", rule.id), { nextRun: run });
  }

  await batch.commit();
  return created;
}
