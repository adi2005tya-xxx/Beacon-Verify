import { NextRequest, NextResponse } from "next/server";
import { renderLetterhead } from "@/lib/pdf";
import { isValidBeaconCode } from "@/lib/beaconCode";
import { KNOWN_KEYS } from "@/lib/fields";

function today(): string {
  return new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const beaconCode = String(body?.beaconCode || "").trim();
  if (!isValidBeaconCode(beaconCode)) {
    return NextResponse.json({ message: "Valid Beacon Code required" }, { status: 400 });
  }
  const plannerType = body?.plannerType === "ESTABLISHED_FIRM" ? "ESTABLISHED_FIRM" : "FREELANCE_INDIVIDUAL";

  const values: Record<string, string> = {};
  for (const [k, v] of Object.entries(body?.values ?? {})) {
    if (KNOWN_KEYS.has(k) && v != null && String(v).trim() !== "") values[k] = String(v).trim();
  }

  const bytes = await renderLetterhead({ beaconCode, plannerType, values, generatedOn: today() });
  return new NextResponse(new Uint8Array(bytes), {
    status: 201,
    headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${beaconCode}-digital-copy.pdf"`,
    },
  });
}
