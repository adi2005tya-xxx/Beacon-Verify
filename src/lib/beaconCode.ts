import "server-only";
import { promises as fs } from "fs";
import * as path from "path";

const FIXED_SEGMENT = "137"; // Beacon: fixed lucky-number segment, never changes
const FILE = process.env.VERIFY_COUNTER_FILE || path.resolve(process.cwd(), ".verify", "counter");

let lock: Promise<void> = Promise.resolve();

/**
 * Allocates permanent, never-reused Beacon Codes of the form BCN-137-NN.
 * The only thing persisted anywhere in Beacon Verify: a single integer in
 * .verify/counter (so codes don't repeat across restarts).
 */
export async function allocateBeaconCode(): Promise<string> {
  let release!: () => void;
  const prev = lock;
  lock = new Promise((r) => (release = r));
  await prev;
  try {
    let current = 0;
    try {
      current = parseInt((await fs.readFile(FILE, "utf8")).trim(), 10) || 0;
    } catch {
      /* first run */
    }
    const next = current + 1;
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await fs.writeFile(FILE, String(next), "utf8");
    const seq = next < 100 ? String(next).padStart(2, "0") : String(next);
    return `BCN-${FIXED_SEGMENT}-${seq}`;
  } finally {
    release();
  }
}

export function isValidBeaconCode(code: string): boolean {
  return /^BCN-137-\d{2,}$/.test(code);
}
