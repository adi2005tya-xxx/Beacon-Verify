import { NextRequest, NextResponse } from "next/server";
import { pinToken, PIN_COOKIE } from "@/lib/pin";

const PUBLIC_PATHS = ["/pin", "/api/pin"];

export async function middleware(req: NextRequest) {
  const pin = process.env.VERIFY_PIN;
  // No PIN configured (e.g. local dev without it set) — gate is off.
  if (!pin) return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get(PIN_COOKIE)?.value;
  const expected = await pinToken(pin);
  if (cookie === expected) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ message: "PIN required" }, { status: 401 });
  }

  const url = req.nextUrl.clone();
  url.pathname = "/pin";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)).*)"],
};
