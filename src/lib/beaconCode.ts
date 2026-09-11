import "server-only";
import { promises as fs } from "fs";
import * as path from "path";

const FIXED_SEGMENT = "137"; // Beacon: fixed lucky-number segment, never changes
const REDIS_KEY = "beacon-verify:counter";

// Vercel's serverless functions have a read-only filesystem, so the
// file-based counter below only works for local dev / a self-hosted server
// with a real disk. On Vercel, add a Redis integration (Storage tab ->
// Marketplace -> "Upstash for Redis", free tier) — it injects
// KV_REST_API_URL/KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_URL/_TOKEN)
// automatically, and this switches to it with no code changes.
function redisEnv(): { url: string; token: string } | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

async function nextFromRedis(): Promise<number> {
  const env = redisEnv()!;
  const { Redis } = await import("@upstash/redis");
  const redis = new Redis({ url: env.url, token: env.token });
  return redis.incr(REDIS_KEY);
}

const FILE = process.env.VERIFY_COUNTER_FILE || path.resolve(process.cwd(), ".verify", "counter");
let fileLock: Promise<void> = Promise.resolve();

async function nextFromFile(): Promise<number> {
  let release!: () => void;
  const prev = fileLock;
  fileLock = new Promise((r) => (release = r));
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
    return next;
  } finally {
    release();
  }
}

/**
 * Allocates a permanent, never-reused Beacon Code of the form BCN-137-NN.
 * Durable storage: Redis if configured (required on Vercel), otherwise a
 * local counter file (fine for local dev or a server with a real disk).
 */
export async function allocateBeaconCode(): Promise<string> {
  let next: number;
  try {
    next = redisEnv() ? await nextFromRedis() : await nextFromFile();
  } catch (err) {
    const hint = redisEnv()
      ? "Redis is configured but the request failed — check the Redis integration is healthy."
      : "No durable counter is configured for this deployment. On Vercel, add a Redis integration (Storage tab -> Marketplace -> Upstash for Redis, free tier) and redeploy.";
    throw new Error(`Could not allocate a Beacon Code: ${hint}`, { cause: err });
  }
  const seq = next < 100 ? String(next).padStart(2, "0") : String(next);
  return `BCN-${FIXED_SEGMENT}-${seq}`;
}

export function isValidBeaconCode(code: string): boolean {
  return /^BCN-137-\d{2,}$/.test(code);
}
