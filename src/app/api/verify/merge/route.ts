import { NextRequest, NextResponse } from "next/server";
import { mergePdfs } from "@/lib/pdf";

const MAX = 25 * 1024 * 1024;
const OK_MIME = new Set(["application/pdf", "image/jpeg", "image/png"]);

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (!files.length) {
    return NextResponse.json({ message: "Upload at least one file" }, { status: 400 });
  }
  for (const f of files) {
    if (f.size > MAX) return NextResponse.json({ message: `${f.name}: exceeds 25 MB limit` }, { status: 400 });
    if (!OK_MIME.has(f.type)) {
      return NextResponse.json({ message: `${f.name}: only PDF, JPG, PNG allowed` }, { status: 400 });
    }
  }

  // optional explicit order: JSON array of indices matching upload order
  let ordered = files;
  const orderRaw = form.get("order");
  if (typeof orderRaw === "string") {
    try {
      const order: number[] = JSON.parse(orderRaw);
      if (Array.isArray(order) && order.length === files.length) {
        const mapped = order.map((i) => files[i]).filter(Boolean);
        if (mapped.length === files.length) ordered = mapped;
      }
    } catch {
      /* ignore bad order, keep upload order */
    }
  }

  const beaconCode = String(form.get("beaconCode") || "merged").replace(/[^\w-]/g, "") || "merged";
  const inputs = await Promise.all(
    ordered.map(async (f) => ({
      bytes: Buffer.from(await f.arrayBuffer()),
      mimeType: f.type,
      filename: f.name,
    })),
  );
  const { bytes } = await mergePdfs(inputs);

  return new NextResponse(new Uint8Array(bytes), {
    status: 201,
    headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${beaconCode}-master.pdf"`,
    },
  });
}
