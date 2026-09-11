// Pure Web Crypto (works in both the Edge middleware runtime and Node route
// handlers) — no Buffer, no Node-only `crypto` module.

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Deterministic token stored in the cookie — never the raw PIN itself. */
export async function pinToken(pin: string): Promise<string> {
  const data = new TextEncoder().encode(`beacon-verify-pin:${pin}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return bufToHex(digest);
}

export const PIN_COOKIE = "bv_pin_ok";
