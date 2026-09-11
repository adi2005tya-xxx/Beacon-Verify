import { NextResponse } from "next/server";
import { allocateBeaconCode } from "@/lib/beaconCode";

export async function POST() {
  const beaconCode = await allocateBeaconCode();
  return NextResponse.json({ success: true, beaconCode }, { status: 201 });
}
