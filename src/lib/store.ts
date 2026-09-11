import "server-only";
import { promises as fs } from "fs";
import * as path from "path";

const ASSETS_DIR = path.resolve(process.cwd(), "assets");
const PREFIX = "beacon-verify";

/**
 * One storage mechanism for everything Beacon Verify needs to remember:
 * the letterhead, the certificate, its fonts, and the running serial number.
 *
 * On Vercel (read-only filesystem) this uses Vercel Blob when
 * BLOB_READ_WRITE_TOKEN is set (Storage tab -> Create Database -> Blob, one
 * click, auto-injects the token). Locally, or if Blob isn't configured, it
 * falls back to the `assets/` folder on disk — so the same admin upload page
 * works in both places.
 */
export function blobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function streamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  const reader = stream.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  return Buffer.concat(chunks);
}

export async function readAsset(name: string): Promise<Buffer | null> {
  if (blobConfigured()) {
    try {
      const { get } = await import("@vercel/blob");
      const result = await get(`${PREFIX}/${name}`, { access: "private", useCache: false });
      if (!result || result.statusCode !== 200) return null;
      return await streamToBuffer(result.stream);
    } catch {
      return null;
    }
  }
  try {
    return await fs.readFile(path.join(ASSETS_DIR, name));
  } catch {
    return null;
  }
}

export async function writeAsset(name: string, bytes: Buffer, contentType: string): Promise<void> {
  if (blobConfigured()) {
    const { put } = await import("@vercel/blob");
    await put(`${PREFIX}/${name}`, bytes, {
      access: "private",
      contentType,
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return;
  }
  const full = path.join(ASSETS_DIR, name);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, bytes);
}

/** Tries `fonts/<baseName>.ttf`, then `.otf` (case variants too). */
export async function readFont(baseName: string): Promise<Buffer | null> {
  for (const ext of [".ttf", ".otf", ".TTF", ".OTF"]) {
    const bytes = await readAsset(`fonts/${baseName}${ext}`);
    if (bytes) return bytes;
  }
  return null;
}

/**
 * Atomic-ish increment of a plain-text counter stored as a blob, using
 * conditional writes (ifMatch on the ETag) with a few retries so two
 * near-simultaneous requests still get distinct numbers.
 */
export async function incrementBlobCounter(name: string): Promise<number> {
  const { get, put } = await import("@vercel/blob");
  const pathname = `${PREFIX}/${name}`;

  for (let attempt = 0; attempt < 5; attempt++) {
    let current = 0;
    let etag: string | undefined;
    try {
      const result = await get(pathname, { access: "private", useCache: false });
      if (result && result.statusCode === 200) {
        current = parseInt((await streamToBuffer(result.stream)).toString("utf8").trim(), 10) || 0;
        etag = result.blob.etag;
      }
    } catch {
      /* blob doesn't exist yet */
    }

    const next = current + 1;
    try {
      if (etag) {
        await put(pathname, String(next), {
          access: "private",
          contentType: "text/plain",
          addRandomSuffix: false,
          allowOverwrite: true,
          ifMatch: etag,
        });
      } else {
        // First write ever — only one concurrent attempt should win; a loser
        // retries and will find the winner's blob (with a real ETag) above.
        await put(pathname, String(next), {
          access: "private",
          contentType: "text/plain",
          addRandomSuffix: false,
          allowOverwrite: false,
        });
      }
      return next;
    } catch {
      // Lost the race — loop and try again with fresh state.
      continue;
    }
  }
  throw new Error("Could not allocate the next number after several attempts (high contention)");
}

export async function readLocalCounter(file: string): Promise<number> {
  try {
    return parseInt((await fs.readFile(file, "utf8")).trim(), 10) || 0;
  } catch {
    return 0;
  }
}

export async function writeLocalCounter(file: string, value: number): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, String(value), "utf8");
}
