"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";
import { useAuth, authErrorMessage } from "@/hooks/useAuth";
import { Button, Field, Input } from "@/components/ui/primitives";

export default function LoginPage() {
  const { login, loginGoogle } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
      router.replace("/dashboard");
    } catch (e) {
      setError(e instanceof FirebaseError ? authErrorMessage(e.code) : "No se pudo iniciar sesión.");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setError(null);
    try {
      await loginGoogle();
      router.replace("/dashboard");
    } catch (e) {
      setError(e instanceof FirebaseError ? authErrorMessage(e.code) : "No se pudo iniciar sesión con Google.");
    }
  }

  return (
    <div className="w-full max-w-sm space-y-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold">Inicia sesión</h1>
        <p className="mt-1 text-sm text-muted">Accede a tu panel de finanzas.</p>
      </div>

      {error && <p role="alert" className="rounded-xl bg-expense/10 px-3.5 py-2.5 text-sm font-medium text-expense">{error}</p>}

      <div className="space-y-4">
        <Field label="Correo electrónico" htmlFor="email">
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" />
        </Field>
        <Field label="Contraseña" htmlFor="password">
          <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="••••••••" />
        </Field>
        <Button onClick={submit} loading={busy} className="w-full">Entrar</Button>
        <Button onClick={google} variant="secondary" className="w-full">Continuar con Google</Button>
      </div>

      <p className="text-sm text-muted">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="font-semibold text-primary hover:underline">Crea una gratis</Link>
      </p>
    </div>
  );
}
