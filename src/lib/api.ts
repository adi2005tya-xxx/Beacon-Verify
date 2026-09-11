"use client";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function parseBody(text: string): any {
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { message: text.slice(0, 200) };
  }
}

async function run<T>(path: string, init: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, init);
  } catch {
    throw new ApiError(0, "Cannot reach the server.");
  }
  const data = parseBody(await res.text());
  if (!res.ok) throw new ApiError(res.status, data?.message || data?.error || `Failed (${res.status})`);
  return data as T;
}

export async function apiJson<T = any>(path: string, body?: any): Promise<T> {
  return run<T>(path, {
    method: "POST",
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export async function apiForm<T = any>(path: string, form: FormData): Promise<T> {
  return run<T>(path, { method: "POST", body: form });
}

/** POST that returns a PDF; triggers a browser download. */
export async function apiDownload(path: string, payload: any, filename: string): Promise<void> {
  const isForm = payload instanceof FormData;
  let res: Response;
  try {
    res = await fetch(path, {
      method: "POST",
      headers: isForm ? undefined : { "Content-Type": "application/json" },
      body: isForm ? payload : JSON.stringify(payload),
    });
  } catch {
    throw new ApiError(0, "Cannot reach the server.");
  }
  if (!res.ok) {
    let msg = `Failed (${res.status})`;
    try {
      const j = JSON.parse(await res.text());
      msg = j?.message || j?.error || msg;
    } catch {}
    throw new ApiError(res.status, msg);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
