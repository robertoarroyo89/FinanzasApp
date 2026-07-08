"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  LayoutDashboard, ArrowLeftRight, Tags, PiggyBank, Target, Repeat2,
  BarChart3, UserRound, Sun, Moon, LogOut, Menu, X, Landmark,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { processRecurring } from "@/lib/recurring";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/primitives";

const NAV = [
  { href: "/dashboard", label: "Panel", icon: LayoutDashboard },
  { href: "/transacciones", label: "Transacciones", icon: ArrowLeftRight },
  { href: "/categorias", label: "Categorías", icon: Tags },
  { href: "/presupuestos", label: "Presupuestos", icon: PiggyBank },
  { href: "/ahorro", label: "Metas de ahorro", icon: Target },
  { href: "/recurrentes", label: "Recurrentes", icon: Repeat2 },
  { href: "/informes", label: "Informes", icon: BarChart3 },
  { href: "/perfil", label: "Perfil", icon: UserRound },
];

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-9 w-9" />;
  const dark = resolvedTheme === "dark";
  return (
    <button
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className="rounded-xl p-2 text-muted hover:bg-raised hover:text-ink"
    >
      {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Guardia de autenticación
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  // Genera las transacciones recurrentes vencidas al entrar en la app
  useEffect(() => {
    if (user) processRecurring(user.uid).catch(console.error);
  }, [user]);

  useEffect(() => setMenuOpen(false), [pathname]);

  if (loading || !user) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <Spinner label="Comprobando sesión…" />
      </div>
    );
  }

  const navList = (
    <nav className="flex flex-col gap-1" aria-label="Navegación principal">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
              active ? "bg-primary/10 font-semibold text-primary" : "text-muted hover:bg-raised hover:text-ink"
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="h-[18px] w-[18px]" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[260px_1fr]">
      {/* Sidebar escritorio */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface p-5 lg:flex">
        <Link href="/dashboard" className="mb-8 flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-ink">
            <Landmark className="h-5 w-5" />
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight">Flujo</span>
        </Link>
        {navList}
        <div className="mt-auto flex items-center justify-between border-t border-line pt-4">
          <button onClick={logout} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted hover:bg-raised hover:text-ink">
            <LogOut className="h-4 w-4" /> Cerrar sesión
          </button>
          <ThemeToggle />
        </div>
      </aside>

      {/* Barra superior móvil */}
      <div className="lg:hidden">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-surface/90 px-4 py-3 backdrop-blur">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-ink">
              <Landmark className="h-4 w-4" />
            </span>
            <span className="font-display text-base font-extrabold">Flujo</span>
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button onClick={() => setMenuOpen((v) => !v)} aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"} aria-expanded={menuOpen} className="rounded-xl p-2 text-muted hover:bg-raised hover:text-ink">
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </header>
        {menuOpen && (
          <div className="fixed inset-x-0 top-[57px] z-40 border-b border-line bg-surface p-4 shadow-card">
            {navList}
            <button onClick={logout} className="mt-3 flex w-full items-center gap-2 rounded-xl border-t border-line px-3.5 pb-1 pt-4 text-sm text-muted">
              <LogOut className="h-4 w-4" /> Cerrar sesión
            </button>
          </div>
        )}
      </div>

      <main className="mx-auto w-full max-w-6xl p-4 pb-16 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
