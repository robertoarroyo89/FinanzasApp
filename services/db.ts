import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs,
  serverTimestamp, setDoc, updateDoc, writeBatch, query, where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DEFAULT_CATEGORIES } from "@/lib/constants";

export const userCol = (uid: string, sub: string) => collection(db, "users", uid, sub);
export const userDoc = (uid: string) => doc(db, "users", uid);

export async function addItem<T extends object>(uid: string, sub: string, data: T) {
  return addDoc(userCol(uid, sub), { ...data, createdAt: serverTimestamp() });
}

export async function updateItem<T extends object>(uid: string, sub: string, id: string, data: T) {
  return updateDoc(doc(db, "users", uid, sub, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteItem(uid: string, sub: string, id: string) {
  return deleteDoc(doc(db, "users", uid, sub, id));
}

/** Crea el perfil y las categorías por defecto en el primer inicio de sesión. */
export async function ensureUserSetup(uid: string, displayName: string, email: string) {
  const profileRef = userDoc(uid);
  const snap = await getDoc(profileRef);
  if (snap.exists()) return;

  await setDoc(profileRef, {
    displayName: displayName || email.split("@")[0],
    email,
    currency: "EUR",
    createdAt: serverTimestamp(),
  });

  const batch = writeBatch(db);
  for (const cat of DEFAULT_CATEGORIES) {
    batch.set(doc(userCol(uid, "categories")), { ...cat, isDefault: true, createdAt: serverTimestamp() });
  }
  await batch.commit();
}

/** Borra todas las transacciones marcadas como demo. */
export async function clearDemoData(uid: string) {
  const subs = ["transactions", "budgets", "savingsGoals", "recurring"];
  for (const sub of subs) {
    const q = query(userCol(uid, sub), where("demo", "==", true));
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
}
