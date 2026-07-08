"use client";

import { useEffect, useState } from "react";
import { onSnapshot, query, orderBy, type OrderByDirection } from "firebase/firestore";
import { userCol } from "@/services/db";
import { useAuth } from "@/hooks/useAuth";

/**
 * Suscripción en tiempo real a una subcolección del usuario.
 * El filtrado avanzado se hace en cliente para evitar índices compuestos.
 */
export function useUserCollection<T extends { id: string }>(
  sub: string,
  orderField?: string,
  dir: OrderByDirection = "desc"
) {
  const { user } = useAuth();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const base = userCol(user.uid, sub);
    const q = orderField ? query(base, orderBy(orderField, dir)) : base;
    const unsub = onSnapshot(
      q,
      (snap) => {
        setData(snap.docs.map((d) => ({ id: d.id, ...d.data() } as T)));
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(`[${sub}]`, err);
        setError("No se pudieron cargar los datos.");
        setLoading(false);
      }
    );
    return unsub;
  }, [user, sub, orderField, dir]);

  return { data, loading, error };
}
