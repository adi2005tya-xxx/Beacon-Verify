"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck } from "lucide-react";

function PinForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || "Incorrect PIN");
      }
      router.replace(params.get("next") || "/");
      router.refresh();
    } catch (e: any) {
      setErr(e.message || "Incorrect PIN");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="w-full max-w-xs rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "#16294f" }}>
        <ShieldCheck className="h-5 w-5 text-white" />
      </div>
      <h1 className="text-[15px] font-extrabold text-slate-900">Beacon Verify</h1>
      <p className="mt-1 text-[12px] text-slate-500">Enter the PIN to continue.</p>
      <input
        autoFocus
        type="password"
        inputMode="numeric"
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        className="mt-4 h-11 w-full rounded-lg border border-slate-300 px-3 text-center text-[18px] tracking-[0.4em] outline-none focus:border-[#16294f] focus:ring-1 focus:ring-[#16294f]/20"
        placeholder="••••"
      />
      {err && <p className="mt-2 text-[12px] font-semibold text-rose-600">{err}</p>}
      <button
        type="submit"
        disabled={busy || !pin}
        className="mt-4 h-10 w-full rounded-lg text-[13px] font-bold text-white transition disabled:opacity-40"
        style={{ background: "#16294f" }}
      >
        {busy ? "Checking…" : "Enter"}
      </button>
    </form>
  );
}

export default function PinPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f7f9] p-6">
      <Suspense fallback={null}>
        <PinForm />
      </Suspense>
    </div>
  );
}
