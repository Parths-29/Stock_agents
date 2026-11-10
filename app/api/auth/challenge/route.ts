import { NextRequest } from "next/server";
import {
  assertOrigin,
  body,
  json,
  errorResponse,
  session,
  SESSION_COOKIE,
  requestOrigin,
} from "@/lib/server/http";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  try {
    assertOrigin(req);
    const { store } = session(req);
    const input = await body(req);
    return json(
      store.challenge(
        req.cookies.get(SESSION_COOKIE)!.value,
        input.address,
        input.chainId,
        requestOrigin(req),
      ),
    );
  } catch (e) {
    return errorResponse(e);
  }
}
