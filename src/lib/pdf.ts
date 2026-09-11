import "server-only";
import { readAsset, readFont } from "./store";
import {
  PDFDocument,
  PDFEmbeddedPage,
  PDFFont,
  PDFPage,
  PageSizes,
  StandardFonts,
  rgb,
} from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { SECTIONS } from "./fields";

/** points per centimetre */
const CM = 28.3464567;
const A4_PORTRAIT: [number, number] = PageSizes.A4; // [595.28, 841.89]
const A4_LANDSCAPE: [number, number] = [PageSizes.A4[1], PageSizes.A4[0]];

const INK = rgb(0.1, 0.1, 0.12);
const NAVY = rgb(0.086, 0.161, 0.31);
const MUTE = rgb(0.42, 0.45, 0.5);
const LINE = rgb(0.8, 0.83, 0.88);

export interface LetterheadInput {
  beaconCode: string;
  plannerType: "FREELANCE_INDIVIDUAL" | "ESTABLISHED_FIRM";
  values: Record<string, string>;
  generatedOn: string;
}
export interface CertificateInput {
  beaconCode: string;
  plannerName: string;
  brandName: string;
  date: string;
  /** Manual override for the name's font size (still shrinks further if it doesn't fit). */
  nameFontSize?: number;
}
export interface MergeFile {
  bytes: Buffer;
  mimeType: string;
  filename: string;
}

/**
 * Layout config (all measurements from the TOP of the page, in cm) — override
 * any value by dropping assets/verify-layout.json (see assets/README.md).
 */
const DEFAULT_LAYOUT = {
  letterhead: {
    background: "letterhead.pdf", // A4 portrait PDF; content is drawn on top
    marginTopCm: 5.5,
    marginBottomCm: 1.5,
    marginLeftCm: 2.2,
    marginRightCm: 2.2,
    bodyFontSize: 10.5,
    headingFontSize: 11,
    stamp: "Stamp.png", // drawn once, right after the last section (e.g. after GST)
    stampSizeCm: 3.5,
  },
  certificate: {
    background: "certificate.png", // .png / .jpg / .pdf — sized to A4 landscape
    plannerName: {
      fromTopCm: 9.64,
      size: 53,
      minSize: 20, // shrinks down to this before it would ever overflow
      maxWidthCm: 24, // fits within this width on an A4-landscape (29.7cm wide) page
      font: "NewIconScript",
      align: "center" as const,
    },
    certificateNo: {
      fromTopCm: 16.53,
      size: 18,
      minSize: 10,
      maxWidthCm: 24,
      font: "Lora",
      align: "center" as const,
      prefix: "Certificate No: ",
      bold: true,
    },
  },
};

async function layout() {
  let merged = DEFAULT_LAYOUT;
  try {
    const raw = await readAsset("verify-layout.json");
    if (raw) merged = deepMerge(DEFAULT_LAYOUT, JSON.parse(raw.toString("utf8")));
  } catch {
    /* use defaults */
  }
  return merged;
}

const asset = readAsset;
const fontFile = readFont;

// ------------------------------------------------------------------ letterhead
export async function renderLetterhead(input: LetterheadInput): Promise<Buffer> {
  const L = (await layout()).letterhead;
  const doc = await PDFDocument.create();
  const times = await doc.embedFont(StandardFonts.TimesRoman);
  const bold = await doc.embedFont(StandardFonts.TimesRomanBold);

  // optional letterhead background
  let bg: PDFEmbeddedPage | null = null;
  let pageSize: [number, number] = A4_PORTRAIT;
  const bgBytes = await asset(L.background);
  if (bgBytes && /\.pdf$/i.test(L.background)) {
    const src = await PDFDocument.load(bgBytes);
    bg = await doc.embedPage(src.getPage(0));
    pageSize = [bg.width, bg.height];
  }

  const marginL = L.marginLeftCm * CM;
  const marginR = L.marginRightCm * CM;

  let page = doc.addPage(pageSize);
  if (bg) page.drawPage(bg, { x: 0, y: 0, width: pageSize[0], height: pageSize[1] });
  let y = pageSize[1] - L.marginTopCm * CM;
  const bottom = L.marginBottomCm * CM;
  const contentW = pageSize[0] - marginL - marginR;

  const nextPage = () => {
    page = doc.addPage(pageSize);
    if (bg) page.drawPage(bg, { x: 0, y: 0, width: pageSize[0], height: pageSize[1] });
    y = pageSize[1] - L.marginTopCm * CM;
  };
  const need = (h: number) => {
    if (y - h < bottom) nextPage();
  };

  const fs2 = L.bodyFontSize;

  // headline — only draw our own title when there's no letterhead background,
  // since the real letterhead already carries "BEACON PLANNER DETAILS".
  if (!bg) {
    page.drawText("PLANNER VERIFICATION — DIGITAL COPY", { x: marginL, y, size: L.headingFontSize + 2, font: bold, color: NAVY });
    y -= L.headingFontSize + 2;
    page.drawLine({ start: { x: marginL, y: y - 2 }, end: { x: marginL + contentW, y: y - 2 }, thickness: 1, color: NAVY });
    y -= 18;
  }

  // One blank line of breathing room from the title box above, then
  // Generated On (left) / Beacon Code (right) on one bold row.
  y -= fs2 + 8;
  need(fs2 + 12);
  const generatedText = `Generated On: ${input.generatedOn}`;
  const codeText = `Beacon Code: ${input.beaconCode}`;
  page.drawText(generatedText, { x: marginL, y, size: fs2 + 0.5, font: bold, color: INK });
  page.drawText(codeText, {
    x: marginL + contentW - bold.widthOfTextAtSize(codeText, fs2 + 0.5),
    y,
    size: fs2 + 0.5,
    font: bold,
    color: INK,
  });
  y -= fs2 + 12;

  for (const section of SECTIONS) {
    if (section.firmOnly && input.plannerType !== "ESTABLISHED_FIRM") continue;
    const rows = section.fields
      .map((f) => [f.label, (input.values[f.key] ?? "").toString().trim()] as [string, string])
      .filter(([, val]) => val.length > 0);
    if (!rows.length && section.n !== 1) continue;

    need(28);
    page.drawText(`${section.n}. ${section.heading}`, { x: marginL, y, size: L.headingFontSize, font: bold, color: NAVY });
    y -= 4;
    page.drawLine({ start: { x: marginL, y: y - 2 }, end: { x: marginL + contentW, y: y - 2 }, thickness: 0.5, color: LINE });
    y -= 14;

    const labelW = 4.6 * CM;
    for (const [label, value] of rows) {
      const lines = wrap(value, times, fs2, contentW - labelW);
      need((fs2 + 3) * lines.length);
      page.drawText(`${label}:`, { x: marginL + 6, y, size: fs2, font: bold, color: INK });
      lines.forEach((ln, i) =>
        page.drawText(ln, { x: marginL + labelW, y: y - i * (fs2 + 2), size: fs2, font: times, color: INK }),
      );
      y -= (fs2 + 3) * lines.length;
    }
    y -= 9;
  }

  // Stamp — drawn once, right after the document's sections end.
  if (L.stamp) {
    const stampBytes = await asset(L.stamp);
    if (stampBytes) {
      const stampImg = /\.png$/i.test(L.stamp) ? await doc.embedPng(stampBytes) : await doc.embedJpg(stampBytes);
      const stampH = (L.stampSizeCm ?? 3.5) * CM;
      const stampW = stampH * (stampImg.width / stampImg.height);
      need(stampH + 8);
      page.drawImage(stampImg, { x: marginL + contentW - stampW, y: y - stampH, width: stampW, height: stampH });
      y -= stampH + 10;
    }
  }

  return Buffer.from(await doc.save());
}

// ----------------------------------------------------------------- certificate
export async function renderCertificate(input: CertificateInput): Promise<Buffer> {
  const C = (await layout()).certificate;
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);

  const scriptBuf = await fontFile(C.plannerName.font);
  // Prefer an actual "<Font>-Bold" file for the certificate number; fall back
  // to faux-bold (double-drawn with a hairline offset) over the regular weight.
  const loraBoldBuf = C.certificateNo.bold ? await fontFile(`${C.certificateNo.font}-Bold`) : null;
  const loraBuf = loraBoldBuf ?? (await fontFile(C.certificateNo.font));
  const nameFont = scriptBuf
    ? await doc.embedFont(scriptBuf, { subset: true })
    : await doc.embedFont(StandardFonts.TimesRomanItalic);
  const noFont = loraBuf
    ? await doc.embedFont(loraBuf, { subset: true })
    : await doc.embedFont(C.certificateNo.bold ? StandardFonts.TimesRomanBold : StandardFonts.TimesRoman);
  const noFauxBold = Boolean(C.certificateNo.bold) && !loraBoldBuf && Boolean(loraBuf);

  const bgBytes = await asset(C.background);
  let page: PDFPage;
  let size: [number, number] = A4_LANDSCAPE;

  if (bgBytes && /\.pdf$/i.test(C.background)) {
    const src = await PDFDocument.load(bgBytes);
    const emb = await doc.embedPage(src.getPage(0));
    size = [emb.width, emb.height];
    page = doc.addPage(size);
    page.drawPage(emb, { x: 0, y: 0, width: size[0], height: size[1] });
  } else if (bgBytes) {
    const img = /\.png$/i.test(C.background) ? await doc.embedPng(bgBytes) : await doc.embedJpg(bgBytes);
    page = doc.addPage(size); // A4 landscape; image scaled to cover
    page.drawImage(img, { x: 0, y: 0, width: size[0], height: size[1] });
  } else {
    page = doc.addPage(size);
    page.drawRectangle({ x: 20, y: 20, width: size[0] - 40, height: size[1] - 40, borderColor: NAVY, borderWidth: 2 });
    const c = (t: string, yy: number, s: number, f: PDFFont, col = INK) =>
      page.drawText(t, { x: (size[0] - f.widthOfTextAtSize(t, s)) / 2, y: yy, size: s, font: f, color: col });
    c("CERTIFICATE OF PARTNERSHIP", size[1] - 120, 26, noFont, NAVY);
    c("This Certificate Is Proudly Presented To", size[1] - 170, 13, noFont, MUTE);
  }

  const H = size[1];
  const W = size[0];

  // "Firm Name - Full Name" (falls back to whichever half is present).
  const name = [input.brandName, input.plannerName].filter(Boolean).join(" - ") || "—";
  const nameMaxWidth = (C.plannerName.maxWidthCm ?? 24) * CM;
  const requestedSize = input.nameFontSize && input.nameFontSize > 0 ? input.nameFontSize : C.plannerName.size;
  const nameFit = fitText(name, nameFont, requestedSize, nameMaxWidth, C.plannerName.minSize ?? 20);
  drawAligned(page, nameFit.text, nameFont, nameFit.size, H - C.plannerName.fromTopCm * CM, W, C.plannerName.align, NAVY);

  const noText = `${C.certificateNo.prefix ?? ""}${input.beaconCode}`;
  const noMaxWidth = (C.certificateNo.maxWidthCm ?? 24) * CM;
  const noFit = fitText(noText, noFont, C.certificateNo.size, noMaxWidth, C.certificateNo.minSize ?? 10);
  drawAligned(page, noFit.text, noFont, noFit.size, H - C.certificateNo.fromTopCm * CM, W, C.certificateNo.align, INK, {
    bold: noFauxBold,
  });

  return Buffer.from(await doc.save());
}

// ---------------------------------------------------------------------- merge
export async function mergePdfs(
  files: MergeFile[],
): Promise<{ bytes: Buffer; totalPages: number; manifest: { filename: string; pages: string }[] }> {
  const out = await PDFDocument.create();
  const manifest: { filename: string; pages: string }[] = [];

  for (const file of files) {
    const start = out.getPageCount() + 1;
    if (file.mimeType === "application/pdf") {
      try {
        const src = await PDFDocument.load(file.bytes, { ignoreEncryption: true });
        const pages = await out.copyPages(src, src.getPageIndices());
        pages.forEach((p) => out.addPage(p));
      } catch {
        await placeholder(out, `Could not read: ${file.filename}`);
      }
    } else if (file.mimeType === "image/png" || file.mimeType === "image/jpeg") {
      const img = file.mimeType === "image/png" ? await out.embedPng(file.bytes) : await out.embedJpg(file.bytes);
      const page = out.addPage(A4_PORTRAIT);
      const scale = Math.min((page.getWidth() - 2 * CM) / img.width, (page.getHeight() - 2 * CM) / img.height, 1);
      page.drawImage(img, {
        x: (page.getWidth() - img.width * scale) / 2,
        y: (page.getHeight() - img.height * scale) / 2,
        width: img.width * scale,
        height: img.height * scale,
      });
    } else {
      await placeholder(out, `Unsupported: ${file.filename}`);
    }
    const end = out.getPageCount();
    manifest.push({ filename: file.filename, pages: start === end ? `${start}` : `${start}-${end}` });
  }

  return { bytes: Buffer.from(await out.save()), totalPages: out.getPageCount(), manifest };
}

function drawAligned(
  page: PDFPage,
  text: string,
  font: PDFFont,
  size: number,
  yBaseline: number,
  pageWidth: number,
  align: "left" | "center" | "right",
  color = INK,
  opts: { bold?: boolean } = {},
) {
  const w = font.widthOfTextAtSize(text, size);
  let x = 2 * CM;
  if (align === "center") x = (pageWidth - w) / 2;
  else if (align === "right") x = pageWidth - 2 * CM - w;
  page.drawText(text, { x, y: yBaseline, size, font, color });
  if (opts.bold) {
    // Faux-bold: a regular-weight font has no bold variant available, so
    // redraw with a hairline offset to thicken the strokes.
    page.drawText(text, { x: x + size * 0.018, y: yBaseline, size, font, color });
  }
}

/** Shrinks (never grows) text to fit maxWidth, down to minSize; ellipsizes as a last resort. */
function fitText(text: string, font: PDFFont, size: number, maxWidth: number, minSize: number): { text: string; size: number } {
  let s = size;
  while (s > minSize && font.widthOfTextAtSize(text, s) > maxWidth) s -= 0.5;
  if (font.widthOfTextAtSize(text, s) <= maxWidth) return { text, size: s };
  let t = text;
  while (t.length > 1 && font.widthOfTextAtSize(`${t}…`, s) > maxWidth) t = t.slice(0, -1);
  return { text: `${t}…`, size: s };
}

async function placeholder(doc: PDFDocument, msg: string) {
  const p = doc.addPage(A4_PORTRAIT);
  const f = await doc.embedFont(StandardFonts.Helvetica);
  p.drawText(msg, { x: 2 * CM, y: p.getHeight() / 2, size: 12, font: f, color: rgb(0.6, 0.1, 0.1) });
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = String(text).split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const word of words) {
    const trial = cur ? `${cur} ${word}` : word;
    if (font.widthOfTextAtSize(trial, size) > maxWidth && cur) {
      lines.push(cur);
      cur = word;
    } else cur = trial;
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : ["—"];
}

function deepMerge<T>(base: T, over: any): T {
  if (typeof base !== "object" || base === null || Array.isArray(base)) return over ?? base;
  const out: any = { ...base };
  for (const k of Object.keys(over ?? {})) {
    out[k] = deepMerge((base as any)[k], over[k]);
  }
  return out;
}
