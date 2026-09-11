"use client";

import { useRef, useState } from "react";
import { Upload, Download, Check, X, FileText } from "lucide-react";
import { apiForm, apiDownload } from "@/lib/api";
import { SECTIONS, FIELD_LABEL } from "@/lib/fields";
import { Button, inputCls, Toast } from "@/components/ui";
import type { Planner } from "@/lib/planner";

type Extracted = { key: string; label: string; value: string };

export function DetailsTab({
  planner,
  setPlanner,
}: {
  planner: Planner;
  setPlanner: (p: Planner) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [extracted, setExtracted] = useState<Extracted[] | null>(null);
  const [detectedType, setDetectedType] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ msg: string; tone: "ok" | "err" } | null>(null);

  const values = planner.values;
  const setValue = (k: string, v: string) =>
    setPlanner({ ...planner, values: { ...planner.values, [k]: v } });

  function flash(msg: string, tone: "ok" | "err") {
    setToast({ msg, tone });
    setTimeout(() => setToast(null), 2600);
  }

  async function onFile(file: File) {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await apiForm<{ fields: Extracted[]; plannerType: string | null }>("/api/verify/extract", fd);
      setExtracted(r.fields);
      setDetectedType(r.plannerType);
      if (!r.fields.length) flash("No recognisable fields found in that file", "err");
    } catch (e: any) {
      flash(e.message || "Extraction failed", "err");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function applyOne(f: Extracted) {
    setValue(f.key, f.value);
    setExtracted((prev) => prev?.filter((x) => x.key !== f.key) ?? null);
  }
  function applyAll() {
    if (!extracted) return;
    const merged = { ...planner.values };
    for (const f of extracted) merged[f.key] = f.value;
    setPlanner({ ...planner, values: merged });
    setExtracted(null);
    flash("Extracted fields applied", "ok");
  }

  async function downloadLetterhead() {
    setBusy(true);
    try {
      await apiDownload(
        "/api/verify/letterhead",
        { beaconCode: planner.beaconCode, plannerType: planner.plannerType, values: planner.values },
        `${planner.beaconCode}-digital-copy.pdf`,
      );
      flash("Digital Copy downloaded", "ok");
    } catch (e: any) {
      flash(e.message || "Could not generate PDF", "err");
    } finally {
      setBusy(false);
    }
  }

  const visibleSections = SECTIONS.filter(
    (s) => !s.firmOnly || planner.plannerType === "ESTABLISHED_FIRM",
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* form */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[14px] font-extrabold text-slate-900">Planner Details</h2>
            <p className="text-[11px] text-slate-500">
              Upload the planner’s details document to auto-fill, then review every field.
            </p>
          </div>
          <Button onClick={downloadLetterhead} disabled={busy}>
            <Download className="h-4 w-4" /> Digital Copy
          </Button>
        </div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) onFile(f);
          }}
          onClick={() => fileRef.current?.click()}
          className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border border-dashed border-slate-300 bg-white py-6 text-center hover:border-slate-400"
        >
          <Upload className="h-5 w-5 text-slate-400" />
          <span className="text-[12px] font-bold text-slate-600">
            {busy ? "Reading…" : "Drop DOC / DOCX / PDF / TXT, or click to browse"}
          </span>
          <span className="text-[10px] text-slate-400">Extraction never overwrites — you approve each field</span>
          <input
            ref={fileRef}
            type="file"
            accept=".doc,.docx,.pdf,.txt"
            hidden
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
          />
        </div>

        {visibleSections.map((section) => (
          <div key={section.n} className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="mb-3 text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
              {section.n}. {section.heading}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {section.fields.map((f) => (
                <label key={f.key} className={f.type === "textarea" ? "sm:col-span-2 block" : "block"}>
                  <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    {f.label}
                  </span>
                  {f.type === "select" ? (
                    <select
                      className={inputCls}
                      value={values[f.key] ?? ""}
                      onChange={(e) => setValue(f.key, e.target.value)}
                    >
                      {f.options!.map((o) => (
                        <option key={o} value={o}>
                          {o || "—"}
                        </option>
                      ))}
                    </select>
                  ) : f.type === "textarea" ? (
                    <textarea
                      className={inputCls + " h-16 py-2"}
                      value={values[f.key] ?? ""}
                      onChange={(e) => setValue(f.key, e.target.value)}
                    />
                  ) : (
                    <input
                      className={inputCls}
                      value={values[f.key] ?? ""}
                      onChange={(e) => setValue(f.key, e.target.value)}
                    />
                  )}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* extracted review panel */}
      <div className="lg:sticky lg:top-4 lg:self-start">
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
            <h3 className="flex items-center gap-1.5 text-[12px] font-extrabold text-slate-800">
              <FileText className="h-3.5 w-3.5" /> Extracted Data
            </h3>
            {extracted && extracted.length > 0 && (
              <button onClick={applyAll} className="text-[11px] font-bold text-[color:var(--navy)] hover:underline">
                Apply all
              </button>
            )}
          </div>
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {!extracted ? (
              <p className="px-2 py-6 text-center text-[11px] text-slate-400">
                Upload a document to see extracted fields here.
              </p>
            ) : extracted.length === 0 ? (
              <p className="px-2 py-6 text-center text-[11px] text-slate-400">All extracted fields handled.</p>
            ) : (
              <>
                {detectedType && (
                  <p className="mb-1 px-2 text-[10px] font-semibold text-slate-400">
                    Detected type: {detectedType === "FREELANCE_INDIVIDUAL" ? "Freelance / Individual" : "Established Firm"}
                  </p>
                )}
                <ul className="space-y-1">
                  {extracted.map((f) => {
                    const current = planner.values[f.key];
                    const differs = current && current !== f.value;
                    return (
                      <li key={f.key} className="rounded-lg border border-slate-100 bg-slate-50 p-2">
                        <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          {FIELD_LABEL[f.key] ?? f.label}
                        </div>
                        <div className="text-[12px] font-semibold text-slate-800">{f.value}</div>
                        {differs && (
                          <div className="text-[10px] text-amber-600">current: {current}</div>
                        )}
                        <div className="mt-1.5 flex gap-1">
                          <button
                            onClick={() => applyOne(f)}
                            className="flex h-6 items-center gap-1 rounded bg-emerald-600 px-2 text-[10px] font-bold text-white"
                          >
                            <Check className="h-3 w-3" /> {differs ? "Replace" : "Accept"}
                          </button>
                          <button
                            onClick={() => setExtracted((p) => p?.filter((x) => x.key !== f.key) ?? null)}
                            className="flex h-6 items-center gap-1 rounded border border-slate-300 px-2 text-[10px] font-bold text-slate-500"
                          >
                            <X className="h-3 w-3" /> Reject
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>

      {toast && <Toast msg={toast.msg} tone={toast.tone} />}
    </div>
  );
}
