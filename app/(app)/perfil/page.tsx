"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { User, Database, Trash2, LogOut, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { userDoc } from "@/services/db";
import { clearDemoData } from "@/services/db";
import { seedDemoData } from "@/lib/seed";
import { profileSchema, type ProfileForm } from "@/lib/schemas";
import { Button, Card, CardTitle, Field, Input } from "@/components/ui/primitives";

export default function PerfilPage() {
  const { user, logout } = useAuth();
  const profile = useProfile();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [demoMsg, setDemoMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: { displayName: profile?.displayName ?? user?.displayName ?? "" },
  });

  if (!user) return null;

  const onSubmit = async (data: ProfileForm) => {
    setSaving(true);
    setSaved(false);
    try {
      await updateProfile(user, { displayName: data.displayName });
      await updateDoc(userDoc(user.uid), { displayName: data.displayName });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const loadDemo = async () => {
    setSeeding(true);
    setDemoMsg(null);
    try {
      await seedDemoData(user.uid);
      setDemoMsg("Datos de demostración cargados. Ve al panel para verlos.");
    } catch {
      setDemoMsg("No se pudieron cargar los datos de demostración.");
    } finally {
      setSeeding(false);
    }
  };

  const removeDemo = async () => {
    if (!confirm("¿Eliminar todos los datos de demostración? Tus datos reales no se tocarán.")) return;
    setClearing(true);
    setDemoMsg(null);
    try {
      await clearDemoData(user.uid);
      setDemoMsg("Datos de demostración eliminados.");
    } catch {
      setDemoMsg("No se pudieron eliminar los datos de demostración.");
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Perfil</h1>
        <p className="text-sm text-muted">Tu cuenta y opciones de la aplicación.</p>
      </div>

      <Card>
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted" />
          <CardTitle>Datos de la cuenta</CardTitle>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <Field label="Nombre" error={errors.displayName?.message} htmlFor="displayName">
            <Input id="displayName" {...register("displayName")} placeholder="Tu nombre" />
          </Field>
          <Field label="Correo electrónico" htmlFor="email">
            <Input id="email" value={user.email ?? ""} disabled className="opacity-70" />
          </Field>
          <div className="flex items-center gap-3">
            <Button type="submit" loading={saving}>Guardar cambios</Button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-income">
                <CheckCircle2 className="h-4 w-4" /> Guardado
              </span>
            )}
          </div>
        </form>
      </Card>

      <Card>
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-muted" />
          <CardTitle>Datos de demostración</CardTitle>
        </div>
        <p className="mt-2 text-sm text-muted">
          Carga movimientos, presupuestos y metas de ejemplo para explorar la aplicación.
          Puedes eliminarlos cuando quieras sin afectar a tus datos reales.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={loadDemo} loading={seeding}>
            Cargar datos de demostración
          </Button>
          <Button variant="danger" onClick={removeDemo} loading={clearing}>
            <Trash2 className="h-4 w-4" /> Borrar datos demo
          </Button>
        </div>
        {demoMsg && <p className="mt-3 text-sm text-muted">{demoMsg}</p>}
      </Card>

      <Card>
        <CardTitle>Sesión</CardTitle>
        <p className="mt-2 text-sm text-muted">Cierra la sesión en este dispositivo.</p>
        <div className="mt-4">
          <Button variant="ghost" onClick={logout}>
            <LogOut className="h-4 w-4" /> Cerrar sesión
          </Button>
        </div>
      </Card>
    </div>
  );
}
