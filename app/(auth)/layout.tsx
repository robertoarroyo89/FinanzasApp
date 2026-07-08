import { Landmark } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Panel de marca */}
      <div className="hidden flex-col justify-between bg-primary p-10 text-primary-ink lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-ink/15">
            <Landmark className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-extrabold tracking-tight">Flujo</span>
        </div>
        <div>
          <p className="font-display text-4xl font-extrabold leading-tight">
            Tu dinero,<br />claro y en orden.
          </p>
          <p className="mt-4 max-w-md text-sm opacity-80">
            Ingresos, gastos, presupuestos y metas de ahorro en un solo panel.
            Decide con datos, no con sensaciones.
          </p>
        </div>
        <p className="text-xs opacity-60">© {new Date().getFullYear()} Flujo</p>
      </div>
      <div className="grid place-items-center p-6">{children}</div>
    </div>
  );
}
