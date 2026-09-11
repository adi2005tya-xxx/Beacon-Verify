import { NextRequest, NextResponse } from "next/server";
import { renderCertificate } from "@/lib/pdf";
import { isValidBeaconCode } from "@/lib/beaconCode";

function today(): string {
  return new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const beaconCode = String(body?.beaconCode || "").trim();
  if (!isValidBeaconCode(beaconCode)) {
    return NextResponse.json({ message: "Valid Beacon Code required" }, { status: 400 });
  }

  const nameFontSize = Number(body?.nameFontSize);

  const bytes = await renderCertificate({
    beaconCode,
    plannerName: String(body?.plannerName || "").trim(),
    brandName: String(body?.brandName || "").trim(),
    date: String(body?.date || today()).trim(),
    nameFontSize: Number.isFinite(nameFontSize) && nameFontSize > 0 ? nameFontSize : undefined,
  });

  return new NextResponse(new Uint8Array(bytes), {
    status: 201,
    headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${beaconCode}-certificate.pdf"`,
    },
  });
}
