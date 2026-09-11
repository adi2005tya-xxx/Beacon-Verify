"use client";

import { useState } from "react";
import { ShieldCheck, FileText, Award, Layers, RotateCcw, ShieldPlus } from "lucide-react";
import { clsx } from "clsx";
import { usePlanner } from "@/lib/planner";
import { apiJson } from "@/lib/api";
import { Button } from "@/components/ui";
import { DetailsTab } from "@/components/DetailsTab";
import { CertificateTab } from "@/components/CertificateTab";
import { MergeTab } from "@/components/MergeTab";

const TABS = [
  { id: "details", label: "Details & Letterhead", icon: FileText },
  { id: "certificate", label: "Certificate", icon: Award },
  { id: "merge", label: "Merge Documents", icon: Layers },
] as const;

export default function Page() {
  const { planner, setPlanner, ready } = usePlanner();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("details");
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState("");

  async function start() {
    setCreating(true);
    setErr("");
    try {
      const r = await apiJson<{ beaconCode: string }>("/api/verify/code", {});
      // Planner type isn't asked — it's decided from the uploaded details
      // document (checkbox + fields present) in the Details tab.
      setPlanner({ beaconCode: r.beaconCode, plannerType: "FREELANCE_INDIVIDUAL", values: {} });
      setTab("details");
    } catch (e: any) {
      setErr(e.message || "Could not reach the server");
    } finally {
      setCreating(false);
    }
  }

  if (!ready) return null;

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "var(--navy)" }}>
            <ShieldCheck className="h-4.5 w-4.5 text-white" />
          </div>
          <div className="leading-tight">
            <div className="text-[14px] font-extrabold tracking-tight text-slate-900">Beacon Verify</div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Planner Verification &amp; Onboarding
            </div>
          </div>
        </div>
        {planner && (
          <div className="flex items-center gap-3">
            <div className="text-right leading-tight">
              <div className="font-mono text-[13px] font-extrabold text-slate-900">{planner.beaconCode}</div>
              <div className="text-[10px] text-slate-400">
                {planner.plannerType === "FREELANCE_INDIVIDUAL" ? "Freelance / Individual" : "Established Firm"}
                {" · detected from document"}
              </div>
            </div>
            <button
              onClick={() => {
                if (confirm("Start a new planner? The current one is not saved anywhere.")) setPlanner(null);
              }}
              className="flex h-8 items-center gap-1 rounded-lg border border-slate-300 px-2.5 text-[11px] font-bold text-slate-500 hover:bg-slate-50"
            >
              <RotateCcw className="h-3.5 w-3.5" /> New
            </button>
          </div>
        )}
      </header>

      {!planner ? (
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center">
            <h1 className="text-[16px] font-extrabold text-slate-900">New Planner Verification</h1>
            <p className="mt-1 text-[12px] text-slate-500">
              A permanent Beacon Code (BCN-137-NN) is generated automatically. Planner type (Freelance vs.
              Established Firm) is decided for you from the uploaded details document — nothing to pick here.
            </p>
            <button
              disabled={creating}
              onClick={start}
              className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[13px] font-bold text-white transition hover:opacity-90 disabled:opacity-50"
              style={{ background: "var(--navy)" }}
            >
              <ShieldPlus className="h-4 w-4" /> {creating ? "Generating code…" : "New Planner"}
            </button>
            {err && <p className="mt-3 text-[12px] font-semibold text-rose-600">{err}</p>}
          </div>
        </div>
      ) : (
        <>
          <nav className="flex gap-1 border-b border-slate-200 bg-white px-4">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={clsx(
                  "flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-[12px] font-bold transition",
                  tab === t.id
                    ? "border-[color:var(--navy)] text-slate-900"
                    : "border-transparent text-slate-400 hover:text-slate-700",
                )}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            ))}
          </nav>

          <div className="flex-1 p-6">
            {tab === "details" && <DetailsTab planner={planner} setPlanner={setPlanner} />}
            {tab === "certificate" && <CertificateTab planner={planner} />}
            {tab === "merge" && <MergeTab planner={planner} />}
          </div>
        </>
      )}
    </div>
  );
}
