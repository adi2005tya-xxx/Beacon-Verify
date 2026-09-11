"use client";

import { useState } from "react";
import { ShieldCheck, FileText, Award, Layers, RotateCcw, User, Building2 } from "lucide-react";
import { clsx } from "clsx";
import { usePlanner, type PlannerType } from "@/lib/planner";
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

  async function start(plannerType: PlannerType) {
    setCreating(true);
    setErr("");
    try {
      const r = await apiJson<{ beaconCode: string }>("/api/verify/code", {});
      setPlanner({ beaconCode: r.beaconCode, plannerType, values: {} });
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
              Pick the planner type. A permanent Beacon Code (BCN-137-NN) is generated automatically.
            </p>
            <div className="mt-5 space-y-2 text-left">
              {(
                [
                  ["FREELANCE_INDIVIDUAL", "Freelance / Individual", "May operate under a separate travel brand name", User],
                  ["ESTABLISHED_FIRM", "Established Firm / Business", "Registered company — proprietorship, LLP, Pvt. Ltd.", Building2],
                ] as const
              ).map(([val, title, desc, Icon]) => (
                <button
                  key={val}
                  disabled={creating}
                  onClick={() => start(val)}
                  className="flex w-full items-start gap-3 rounded-xl border border-slate-200 p-3 text-left transition hover:border-slate-400 disabled:opacity-50"
                >
                  <Icon className="mt-0.5 h-5 w-5 text-slate-500" />
                  <div>
                    <div className="text-[13px] font-bold text-slate-800">{title}</div>
                    <div className="text-[11px] text-slate-500">{desc}</div>
                  </div>
                </button>
              ))}
            </div>
            {err && <p className="mt-3 text-[12px] font-semibold text-rose-600">{err}</p>}
            {creating && <p className="mt-3 text-[12px] text-slate-400">Generating code…</p>}
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
