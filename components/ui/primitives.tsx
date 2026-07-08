"use client";

import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

/* ---------- Button ---------- */
type BtnVariant = "primary" | "secondary" | "ghost" | "danger";
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  loading?: boolean;
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", loading, children, disabled, ...props }, ref) => {
    const styles: Record<BtnVariant, string> = {
      primary: "bg-primary text-primary-ink hover:opacity-90",
      secondary: "bg-raised text-ink border border-line hover:bg-line/60",
      ghost: "text-muted hover:text-ink hover:bg-raised",
      danger: "bg-expense text-white hover:opacity-90",
    };
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
          styles[variant],
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

/* ---------- Field wrapper ---------- */
export function Field({ label, error, children, htmlFor }: { label: string; error?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-muted">{label}</label>
      {children}
      {error && <p role="alert" className="text-xs font-medium text-expense">{error}</p>}
    </div>
  );
}

const inputBase =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/70 focus:border-primary";

/* ---------- Input ---------- */
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn(inputBase, className)} {...props} />
);
Input.displayName = "Input";

/* ---------- Select ---------- */
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn(inputBase, "appearance-none", className)} {...props}>
      {children}
    </select>
  )
);
Select.displayName = "Select";

/* ---------- Textarea ---------- */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => <textarea ref={ref} className={cn(inputBase, "min-h-[84px]", className)} {...props} />
);
Textarea.displayName = "Textarea";

/* ---------- Card ---------- */
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-xl2 border border-line bg-surface p-5 shadow-card", className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cn("font-display text-sm font-semibold uppercase tracking-wider text-muted", className)}>{children}</h2>;
}

/* ---------- Badge ---------- */
export function Badge({ children, tone = "neutral", className }: { children: ReactNode; tone?: "income" | "expense" | "neutral" | "gold"; className?: string }) {
  const tones = {
    income: "bg-income/10 text-income",
    expense: "bg-expense/10 text-expense",
    neutral: "bg-raised text-muted",
    gold: "bg-gold/10 text-gold",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[tone], className)}>
      {children}
    </span>
  );
}

/* ---------- Progress ---------- */
export function Progress({ value, color, over }: { value: number; color?: string; over?: boolean }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-raised" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div
        className={cn("h-full rounded-full transition-all", over && "bg-expense")}
        style={{ width: `${pct}%`, backgroundColor: over ? undefined : color ?? "rgb(var(--primary))" }}
      />
    </div>
  );
}

/* ---------- Spinner ---------- */
export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-muted" role="status">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}

/* ---------- EmptyState ---------- */
export function EmptyState({ icon, title, hint, action }: { icon?: ReactNode; title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl2 border border-dashed border-line py-12 text-center">
      {icon && <div className="text-muted">{icon}</div>}
      <p className="font-display text-base font-semibold">{title}</p>
      {hint && <p className="max-w-sm text-sm text-muted">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/* ---------- Punto de categoría ---------- */
export function CategoryDot({ color, className }: { color: string; className?: string }) {
  return <span className={cn("inline-block h-2.5 w-2.5 shrink-0 rounded-full", className)} style={{ backgroundColor: color }} aria-hidden />;
}
