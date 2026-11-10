import { NextRequest, NextResponse } from "next/server";
import { getStore, ServiceError } from "./store";
export const SESSION_COOKIE = "stockpaws_session";
export function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
export function errorResponse(error: unknown) {
  if (error instanceof ServiceError)
    return json({ error: error.message }, error.status);
  console.error(
    "StockPaws backend failure:",
    error instanceof Error ? error.message : "Unknown failure",
  );
  return json({ error: "Backend unavailable. Try again." }, 503);
}
export function requestOrigin(req: NextRequest) {
  const url = new URL(req.url);
  return (
    process.env.APP_ORIGIN ||
    `${url.protocol}//${req.headers.get("host") || url.host}`
  );
}
export function assertOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  // Next may normalize the internal URL hostname. The browser's Host header
  // retains the actual origin it used (for example 127.0.0.1 versus localhost).
  const expected = requestOrigin(req);
  if (!origin || origin !== expected)
    throw new ServiceError("Same-origin requests only.", 403);
}
export function session(req: NextRequest, bucket?: string, limit = 30) {
  const store = getStore(),
    owner = store.authenticate(req.cookies.get(SESSION_COOKIE)?.value);
  if (bucket) store.quota(owner, bucket, limit);
  return { store, owner };
}
export async function body(req: NextRequest, maxBytes = 16384) {
  if (!req.headers.get("content-type")?.includes("application/json"))
    throw new ServiceError("Expected JSON.", 415);
  const reader = req.body?.getReader();
  if (!reader) throw new ServiceError("Request body required.");
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new ServiceError("Request body too large.", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  try {
    const data = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!data || typeof data !== "object" || Array.isArray(data))
      throw new Error();
    return data;
  } catch {
    throw new ServiceError("Invalid JSON.", 400);
  }
}
