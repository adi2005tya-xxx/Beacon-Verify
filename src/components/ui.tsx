"use client";

import { clsx } from "clsx";

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline" | "danger";
}) {
  const styles = {
    primary: "text-white",
    ghost: "text-slate-600 hover:bg-slate-100",
    outline: "border border-slate-300 text-slate-700 hover:bg-slate-50",
    danger: "text-white bg-rose-600 hover:bg-rose-700",
  }[variant];
  return (
    <button
      {...props}
      style={variant === "primary" ? { background: "var(--navy)" } : undefined}
      className={clsx(
        "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-4 text-[12px] font-bold transition hover:opacity-90 disabled:pointer-events-none disabled:opacity-40",
        styles,
        className,
      )}
    >
      {children}
    </button>
  );
}

export const inputCls =
  "w-full h-9 px-3 rounded-lg border border-slate-300 bg-white text-[13px] outline-none focus:border-[color:var(--navy)] focus:ring-1 focus:ring-[color:var(--navy)]/20";

export function Toast({ msg, tone }: { msg: string; tone: "ok" | "err" }) {
  return (
    <div
      className={clsx(
        "fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-lg px-4 py-2.5 text-[12px] font-semibold text-white shadow-lg",
        tone === "ok" ? "bg-emerald-600" : "bg-rose-600",
      )}
    >
      {msg}
    </div>
  );
}
