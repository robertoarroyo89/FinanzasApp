"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";
import { useAuth, authErrorMessage } from "@/hooks/useAuth";
import { Button, Field, Input } from "@/components/ui/primitives";

export default function RegistroPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    if (name.trim().length < 2) return setError("Escribe tu nombre.");
    setBusy(true);
    try {
      await register(name.trim(), email, password);
      router.replace("/dashboard");
    } catch (e) {
      setError(e instanceof FirebaseError ? authErrorMessage(e.code) : "No se pudo crear la cuenta.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-sm space-y-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold">Crea tu cuenta</h1>
        <p className="mt-1 text-sm text-muted">Empieza a ordenar tus finanzas en un minuto.</p>
      </div>

      {error && <p role="alert" className="rounded-xl bg-expense/10 px-3.5 py-2.5 text-sm font-medium text-expense">{error}</p>}

      <div className="space-y-4">
        <Field label="Nombre" htmlFor="name">
          <Input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" />
        </Field>
        <Field label="Correo electrónico" htmlFor="email">
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" />
        </Field>
        <Field label="Contraseña" htmlFor="password">
          <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="Mínimo 6 caracteres" />
        </Field>
        <Button onClick={submit} loading={busy} className="w-full">Crear cuenta</Button>
      </div>

      <p className="text-sm text-muted">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">Inicia sesión</Link>
      </p>
    </div>
  );
}
