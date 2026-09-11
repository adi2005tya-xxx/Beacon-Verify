import { NextResponse } from "next/server";
import { allocateBeaconCode } from "@/lib/beaconCode";

export async function POST() {
  try {
    const beaconCode = await allocateBeaconCode();
    return NextResponse.json({ success: true, beaconCode }, { status: 201 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ message: err?.message || "Could not allocate a Beacon Code" }, { status: 500 });
  }
}
