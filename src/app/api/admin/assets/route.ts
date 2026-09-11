import { NextRequest, NextResponse } from "next/server";
import { readAsset, readFont, writeAsset, blobConfigured } from "@/lib/store";
import { ASSET_SLOTS } from "@/lib/assetSlots";

const MAX = 10 * 1024 * 1024; // 10 MB — plenty for a letterhead/certificate/font

export async function GET() {
  const status: Record<string, boolean> = {};
  for (const slot of ASSET_SLOTS) {
    const bytes = slot.kind === "font" ? await readFont(slot.baseKey) : await readAsset(slot.baseKey);
    status[slot.key] = Boolean(bytes);
  }
  return NextResponse.json({ success: true, status, usingBlob: blobConfigured() });
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const slotKey = String(form.get("slot") || "");
  const file = form.get("file");
  const slot = ASSET_SLOTS.find((s) => s.key === slotKey);

  if (!slot) return NextResponse.json({ message: "Unknown asset slot" }, { status: 400 });
  if (!(file instanceof File)) return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ message: "File exceeds 10 MB limit" }, { status: 400 });

  let targetName: string;
  if (slot.kind === "font") {
    const ext = /\.(ttf|otf)$/i.exec(file.name)?.[1]?.toLowerCase() || "ttf";
    targetName = `fonts/${slot.baseKey}.${ext}`;
  } else {
    if (!new RegExp(`\\.(${slot.accept.replace(/\./g, "").replace(/,/g, "|")})$`, "i").test(file.name)) {
      return NextResponse.json({ message: `Expected a file matching ${slot.accept}` }, { status: 400 });
    }
    targetName = slot.baseKey;
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  await writeAsset(targetName, bytes, file.type || "application/octet-stream");
  return NextResponse.json({ success: true, slot: slotKey, filename: targetName });
}
