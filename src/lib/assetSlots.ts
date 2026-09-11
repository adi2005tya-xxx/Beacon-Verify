// Plain data — safe to import from both the admin page (client) and the
// admin API route (server).

export interface AssetSlot {
  key: string;
  label: string;
  hint: string;
  accept: string;
  kind: "file" | "font";
  /** Exact filename for `kind: "file"`; base name (no extension) for `kind: "font"`. */
  baseKey: string;
}

export const ASSET_SLOTS: AssetSlot[] = [
  {
    key: "letterhead",
    label: "Letterhead",
    hint: "A4 portrait PDF, 1 page — the Digital Copy is drawn on top of it.",
    accept: ".pdf",
    kind: "file",
    baseKey: "letterhead.pdf",
  },
  {
    key: "certificate",
    label: "Certificate Template",
    hint: "A4-landscape proportions (≈1.414:1) PNG or JPG.",
    accept: ".png,.jpg,.jpeg",
    kind: "file",
    baseKey: "certificate.png",
  },
  {
    key: "stamp",
    label: "Verification Stamp",
    hint: "Drawn on the letterhead right after the last section (e.g. after GST).",
    accept: ".png",
    kind: "file",
    baseKey: "Stamp.png",
  },
  {
    key: "font-name",
    label: "Certificate Name Font",
    hint: "TTF or OTF — used for the planner name on the certificate.",
    accept: ".ttf,.otf",
    kind: "font",
    baseKey: "NewIconScript",
  },
  {
    key: "font-no",
    label: "Certificate Number Font",
    hint: "TTF or OTF — used for \"Certificate No: BCN-137-NN\".",
    accept: ".ttf,.otf",
    kind: "font",
    baseKey: "Lora",
  },
  {
    key: "font-no-bold",
    label: "Certificate Number Font (Bold)",
    hint: "Optional — if omitted, bold is faked over the regular weight above.",
    accept: ".ttf,.otf",
    kind: "font",
    baseKey: "Lora-Bold",
  },
];
