"use client";

import { useState } from "react";
import { Download, Award, Minus, Plus } from "lucide-react";
import { apiDownload } from "@/lib/api";
import { Button, inputCls, Toast } from "@/components/ui";
import type { Planner } from "@/lib/planner";

const DEFAULT_NAME_SIZE = 53;
const MIN_SIZE = 12;
const MAX_SIZE = 80;

export function CertificateTab({ planner }: { planner: Planner }) {
  const [plannerName, setPlannerName] = useState(planner.values.fullName || planner.values.idName || "");
  const [brandName, setBrandName] = useState(planner.values.firmName || "");
  const [date, setDate] = useState(
    new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
  );
  const [nameFontSize, setNameFontSize] = useState(DEFAULT_NAME_SIZE);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ msg: string; tone: "ok" | "err" } | null>(null);

  function clampSize(n: number) {
    return Math.min(MAX_SIZE, Math.max(MIN_SIZE, Math.round(n)));
  }

  async function download() {
    setBusy(true);
    try {
      await apiDownload(
        "/api/verify/certificate",
        { beaconCode: planner.beaconCode, plannerName, brandName, date, nameFontSize },
        `${planner.beaconCode}-certificate.pdf`,
      );
      setToast({ msg: "Certificate downloaded", tone: "ok" });
    } catch (e: any) {
      setToast({ msg: e.message || "Could not generate certificate", tone: "err" });
    } finally {
      setBusy(false);
      setTimeout(() => setToast(null), 2600);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-slate-500" />
          <h2 className="text-[14px] font-extrabold text-slate-900">Verification Certificate</h2>
        </div>
        <p className="mt-1 text-[11px] text-slate-500">
          The Beacon Code and name below are drawn onto the certificate template, as "Business / Brand Name - Planner Name".
        </p>

        <div className="mt-5 space-y-3">
          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-400">Beacon Code</span>
            <input className={inputCls + " font-mono bg-slate-50"} value={planner.beaconCode} readOnly />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-400">Planner Name</span>
            <input className={inputCls} value={plannerName} onChange={(e) => setPlannerName(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Business / Brand Name
            </span>
            <input className={inputCls} value={brandName} onChange={(e) => setBrandName(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-400">Date</span>
            <input className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
          </label>

          <div>
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Name Font Size on Certificate
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setNameFontSize((s) => clampSize(s - 1))}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
                aria-label="Decrease font size"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="number"
                min={MIN_SIZE}
                max={MAX_SIZE}
                className={inputCls + " text-center"}
                value={nameFontSize}
                onChange={(e) => setNameFontSize(clampSize(Number(e.target.value) || DEFAULT_NAME_SIZE))}
              />
              <button
                type="button"
                onClick={() => setNameFontSize((s) => clampSize(s + 1))}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
                aria-label="Increase font size"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <span className="mt-1 block text-[10px] text-slate-400">
              Still auto-shrinks further if the name is too wide for the certificate.
            </span>
          </div>
        </div>

        <Button onClick={download} disabled={busy} className="mt-5 w-full">
          <Download className="h-4 w-4" /> {busy ? "Generating…" : "Download Certificate"}
        </Button>
        <p className="mt-3 text-[10px] text-slate-400">
          Uses <code className="mx-1 rounded bg-slate-100 px-1">assets/certificate.png</code> and the fonts in
          <code className="mx-1 rounded bg-slate-100 px-1">assets/fonts/</code> if present, otherwise a placeholder certificate.
        </p>
      </div>
      {toast && <Toast msg={toast.msg} tone={toast.tone} />}
    </div>
  );
}
