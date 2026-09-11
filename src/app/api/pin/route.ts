import { NextRequest, NextResponse } from "next/server";
import { pinToken, PIN_COOKIE } from "@/lib/pin";

export async function POST(req: NextRequest) {
  const configured = process.env.VERIFY_PIN;
  if (!configured) {
    return NextResponse.json({ message: "PIN protection isn't configured on the server" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const pin = String(body?.pin ?? "");
  if (!pin || pin !== configured) {
    return NextResponse.json({ message: "Incorrect PIN" }, { status: 401 });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set(PIN_COOKIE, await pinToken(pin), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180, // 180 days
  });
  return res;
}
