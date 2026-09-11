"use client";

import { useRef, useState } from "react";
import { Upload, Download, ArrowUp, ArrowDown, Trash2, FileText, Image as ImageIcon } from "lucide-react";
import { apiDownload } from "@/lib/api";
import { Button, Toast } from "@/components/ui";
import type { Planner } from "@/lib/planner";

const OK = ["application/pdf", "image/jpeg", "image/png"];

export function MergeTab({ planner }: { planner: Planner }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ msg: string; tone: "ok" | "err" } | null>(null);

  function add(list: FileList | null) {
    if (!list) return;
    const incoming = Array.from(list).filter((f) => OK.includes(f.type));
    const rejected = Array.from(list).length - incoming.length;
    setFiles((prev) => [...prev, ...incoming]);
    if (rejected) flash(`${rejected} file(s) skipped — only PDF, JPG, PNG`, "err");
    if (fileRef.current) fileRef.current.value = "";
  }
  function flash(msg: string, tone: "ok" | "err") {
    setToast({ msg, tone });
    setTimeout(() => setToast(null), 2600);
  }
  function move(i: number, dir: -1 | 1) {
    setFiles((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  async function merge() {
    if (!files.length) return;
    setBusy(true);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("files", f));
      fd.append("order", JSON.stringify(files.map((_, i) => i)));
      fd.append("beaconCode", planner.beaconCode);
      await apiDownload("/api/verify/merge", fd, `${planner.beaconCode}-master.pdf`);
      flash("Master PDF downloaded", "ok");
    } catch (e: any) {
      flash(e.message || "Merge failed", "err");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[14px] font-extrabold text-slate-900">Merge Documents</h2>
          <p className="text-[11px] text-slate-500">
            Combine PDFs and images into one PDF, in the order listed. Drag the arrows to reorder.
          </p>
        </div>
        <Button onClick={merge} disabled={busy || !files.length}>
          <Download className="h-4 w-4" /> {busy ? "Merging…" : "Merge & Download"}
        </Button>
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          add(e.dataTransfer.files);
        }}
        onClick={() => fileRef.current?.click()}
        className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border border-dashed border-slate-300 bg-white py-7 text-center hover:border-slate-400"
      >
        <Upload className="h-5 w-5 text-slate-400" />
        <span className="text-[12px] font-bold text-slate-600">Drop files, or click to add</span>
        <span className="text-[10px] text-slate-400">PDF, JPG, PNG · up to 25 MB each</span>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          multiple
          hidden
          onChange={(e) => add(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <ol className="space-y-1.5">
          {files.map((f, i) => (
            <li key={i} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-slate-100 text-[11px] font-bold text-slate-500">
                {i + 1}
              </span>
              {f.type === "application/pdf" ? (
                <FileText className="h-4 w-4 shrink-0 text-rose-500" />
              ) : (
                <ImageIcon className="h-4 w-4 shrink-0 text-blue-500" />
              )}
              <span className="flex-1 truncate text-[12px] text-slate-700">{f.name}</span>
              <span className="text-[10px] text-slate-400">{(f.size / 1024).toFixed(0)} KB</span>
              <button onClick={() => move(i, -1)} disabled={i === 0} className="text-slate-400 hover:text-slate-700 disabled:opacity-30">
                <ArrowUp className="h-4 w-4" />
              </button>
              <button
                onClick={() => move(i, 1)}
                disabled={i === files.length - 1}
                className="text-slate-400 hover:text-slate-700 disabled:opacity-30"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
              <button
                onClick={() => setFiles((prev) => prev.filter((_, x) => x !== i))}
                className="text-slate-400 hover:text-rose-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ol>
      )}

      {toast && <Toast msg={toast.msg} tone={toast.tone} />}
    </div>
  );
}
