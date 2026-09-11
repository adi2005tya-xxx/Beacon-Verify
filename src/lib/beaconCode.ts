import "server-only";
import { blobConfigured, incrementBlobCounter, readLocalCounter, writeLocalCounter } from "./store";
import * as path from "path";

const FIXED_SEGMENT = "137"; // Beacon: fixed lucky-number segment, never changes
const COUNTER_NAME = "counter.txt";
const FILE = process.env.VERIFY_COUNTER_FILE || path.resolve(process.cwd(), ".verify", "counter");

// Optional alternative to Blob, for anyone who already set up Redis.
function redisEnv(): { url: string; token: string } | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

async function nextFromRedis(): Promise<number> {
  const env = redisEnv()!;
  const { Redis } = await import("@upstash/redis");
  const redis = new Redis({ url: env.url, token: env.token });
  return redis.incr("beacon-verify:counter");
}

let fileLock: Promise<void> = Promise.resolve();
async function nextFromFile(): Promise<number> {
  let release!: () => void;
  const prev = fileLock;
  fileLock = new Promise((r) => (release = r));
  await prev;
  try {
    const next = (await readLocalCounter(FILE)) + 1;
    await writeLocalCounter(FILE, next);
    return next;
  } finally {
    release();
  }
}

/**
 * Allocates a permanent, never-reused Beacon Code of the form BCN-137-NN.
 * Durable storage, in order of preference: Redis (if you already have it),
 * else Vercel Blob (recommended — one click, no separate account), else a
 * local counter file (fine for local dev / a server with a real disk).
 */
export async function allocateBeaconCode(): Promise<string> {
  let next: number;
  try {
    if (redisEnv()) next = await nextFromRedis();
    else if (blobConfigured()) next = await incrementBlobCounter(COUNTER_NAME);
    else next = await nextFromFile();
  } catch (err) {
    throw new Error(
      "Could not allocate a Beacon Code. On Vercel, add Blob storage (Storage tab -> Create Database -> Blob) and redeploy.",
      { cause: err },
    );
  }
  const seq = next < 100 ? String(next).padStart(2, "0") : String(next);
  return `BCN-${FIXED_SEGMENT}-${seq}`;
}

export function isValidBeaconCode(code: string): boolean {
  return /^BCN-137-\d{2,}$/.test(code);
}
