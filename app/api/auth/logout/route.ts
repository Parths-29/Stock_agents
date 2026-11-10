import { NextRequest } from "next/server";
import {
  assertOrigin,
  json,
  errorResponse,
  SESSION_COOKIE,
} from "@/lib/server/http";
import { getStore } from "@/lib/server/store";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  try {
    assertOrigin(req);
    getStore().revoke(req.cookies.get(SESSION_COOKIE)?.value);
    const response = json({ ok: true });
    response.cookies.delete(SESSION_COOKIE);
    return response;
  } catch (e) {
    return errorResponse(e);
  }
}
