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
import { verifyWalletSignIn } from "@/lib/server/auth";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  try {
    assertOrigin(req);
    const { store } = session(req, "auth-verify", 8),
      input = await body(req);
    const result = await verifyWalletSignIn(
      store,
      req.cookies.get(SESSION_COOKIE)!.value,
      input.challengeId,
      input.signature,
      requestOrigin(req),
    );
    const response = json({
      identity: { authenticated: true, address: result.address },
    });
    response.cookies.set(SESSION_COOKIE, result.token, {
      httpOnly: true,
      sameSite: "strict",
      secure: requestOrigin(req).startsWith("https:"),
      path: "/",
      maxAge: 7 * 86400,
    });
    return response;
  } catch (e) {
    return errorResponse(e);
  }
}
