import "server-only";
import * as mammoth from "mammoth";
import { ALL_FIELDS, LABEL_TO_KEY, SECTION_LABELS } from "./fields";

export interface ExtractedField {
  key: string;
  label: string;
  value: string;
}
export interface ExtractionResult {
  plannerType: "FREELANCE_INDIVIDUAL" | "ESTABLISHED_FIRM" | null;
  fields: ExtractedField[];
  rawText: string;
}

const FIELD_LABEL = new Map(ALL_FIELDS.map((f) => [f.key, f.label]));

export async function toText(buffer: Buffer, mimeType: string, filename = ""): Promise<string> {
  const name = filename.toLowerCase();
  try {
    if (
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      name.endsWith(".docx")
    ) {
      return (await mammoth.extractRawText({ buffer })).value;
    }
    if (mimeType === "application/pdf" || name.endsWith(".pdf")) {
      const pdfParse = require("pdf-parse");
      return (await pdfParse(buffer)).text as string;
    }
    return buffer.toString("utf8");
  } catch {
    // Unreadable / corrupt file — caller surfaces "no fields found".
    return "";
  }
}

export function parseDetails(rawText: string): ExtractionResult {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.replace(/ /g, " ").trim())
    .filter(Boolean);

  const out = new Map<string, string>();
  let section = 0;
  let plannerType: ExtractionResult["plannerType"] = null;

  for (const line of lines) {
    const sec = line.match(/^(\d{1,2})[.)]\s*(.+)$/);
    if (sec && Number(sec[1]) >= 1 && Number(sec[1]) <= 10) {
      section = Number(sec[1]);
      continue;
    }

    // planner type checkboxes (section 1)
    if (/freelance\s*\/?\s*individual/i.test(line) && /^[☑☒✔✓xX]/.test(line)) {
      plannerType = "FREELANCE_INDIVIDUAL";
    }
    if (/established\s*firm\s*\/?\s*business/i.test(line) && /^[☑☒✔✓xX]/.test(line)) {
      plannerType = "ESTABLISHED_FIRM";
    }

    const kv = line.match(/^([A-Za-z][A-Za-z0-9 /()'.&\-]{1,70}?)\s*[:\-–]\s*(.+)$/);
    if (!kv) continue;
    const label = kv[1].trim().replace(/\s+/g, " ").toLowerCase();
    let value = kv[2].trim().replace(/^[☑☒✔✓]\s*/, "").trim();
    if (!value || /^(n\/?a|not applicable|--?|—|\(if applicable\))$/i.test(value)) continue;

    let key: string | undefined = SECTION_LABELS[section]?.[label];
    if (!key) key = LABEL_TO_KEY.find((e) => e.re.test(label))?.key;
    if (key && !out.has(key)) {
      if (key === "businessType") value = value.split("/")[0].trim();
      if (key === "gstRegistered") value = /yes|true/i.test(value) ? "Yes" : "No";
      out.set(key, value);
    }
  }

  return {
    plannerType,
    rawText,
    fields: [...out.entries()].map(([key, value]) => ({
      key,
      label: FIELD_LABEL.get(key) ?? key,
      value,
    })),
  };
}
