import { NextRequest } from "next/server";
import {
  session,
  json,
  errorResponse,
  assertOrigin,
  body,
} from "@/lib/server/http";
export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  try {
    const { store, owner } = session(req);
    const { journal, petStates } = store.snapshot(owner);
    return json({ journal, petStates });
  } catch (e) {
    return errorResponse(e);
  }
}
export async function POST(req: NextRequest) {
  try {
    assertOrigin(req);
    const { store, owner } = session(req, "memory", 60);
    const input = await body(req);
    if (input.kind === "note") return json(store.note(owner, input.text));
    if (input.kind === "pet") return json(store.pet(owner, input.petId));
    return json({ error: "Unknown memory action." }, 400);
  } catch (e) {
    return errorResponse(e);
  }
}
