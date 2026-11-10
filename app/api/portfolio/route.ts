import { NextRequest } from "next/server";
import { session, json, errorResponse } from "@/lib/server/http";
export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  try {
    const { store, owner } = session(req);
    return json(store.snapshot(owner));
  } catch (e) {
    return errorResponse(e);
  }
}
