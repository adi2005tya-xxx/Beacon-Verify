"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, ShieldCheck, Upload } from "lucide-react";
import { ASSET_SLOTS } from "@/lib/assetSlots";

type Status = Record<string, boolean>;

export default function AdminAssetsPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [usingBlob, setUsingBlob] = useState(false);
  const [busySlot, setBusySlot] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; tone: "ok" | "err" } | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  async function refresh() {
    const res = await fetch("/api/admin/assets");
    const data = await res.json();
    setStatus(data.status);
    setUsingBlob(Boolean(data.usingBlob));
  }

  useEffect(() => {
    refresh();
  }, []);

  async function upload(slotKey: string, file: File) {
    setBusySlot(slotKey);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append("slot", slotKey);
      fd.append("file", file);
      const res = await fetch("/api/admin/assets", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Upload failed");
      setMsg({ text: `Uploaded: ${data.filename}`, tone: "ok" });
      await refresh();
    } catch (e: any) {
      setMsg({ text: e.message || "Upload failed", tone: "err" });
    } finally {
      setBusySlot(null);
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl p-6">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "#16294f" }}>
            <ShieldCheck className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-[15px] font-extrabold text-slate-900">Brand Assets</h1>
            <p className="text-[11px] text-slate-500">
              Stored via {usingBlob ? "Vercel Blob (persists across deploys)" : "the local assets/ folder"}.
            </p>
          </div>
        </div>
        <Link href="/" className="text-[12px] font-bold text-slate-500 hover:text-slate-900">
          ← Back
        </Link>
      </header>

      {msg && (
        <p
          className={`mb-4 rounded-lg px-3 py-2 text-[12px] font-semibold ${
            msg.tone === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
          }`}
        >
          {msg.text}
        </p>
      )}

      <div className="space-y-2">
        {ASSET_SLOTS.map((slot) => {
          const present = status?.[slot.key];
          const busy = busySlot === slot.key;
          return (
            <div key={slot.key} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
              {present ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
              ) : (
                <Circle className="h-5 w-5 shrink-0 text-slate-300" />
              )}
              <div className="flex-1">
                <div className="text-[13px] font-bold text-slate-800">{slot.label}</div>
                <div className="text-[11px] text-slate-400">{slot.hint}</div>
              </div>
              <input
                ref={(el) => {
                  fileRefs.current[slot.key] = el;
                }}
                type="file"
                accept={slot.accept}
                hidden
                onChange={(e) => e.target.files?.[0] && upload(slot.key, e.target.files[0])}
              />
              <button
                onClick={() => fileRefs.current[slot.key]?.click()}
                disabled={busy}
                className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-[11px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                <Upload className="h-3.5 w-3.5" /> {busy ? "Uploading…" : present ? "Replace" : "Upload"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
