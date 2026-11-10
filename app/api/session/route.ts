import { NextRequest } from "next/server";
import { getStore } from "@/lib/server/store";
import { errorResponse, json, SESSION_COOKIE } from "@/lib/server/http";
export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  try {
    if (req.headers.get("sec-fetch-site") === "cross-site")
      return json({ error: "Same-origin sessions only." }, 403);
    const store = getStore();
    let owner: string;
    let token: string | undefined;
    try {
      owner = store.authenticate(req.cookies.get(SESSION_COOKIE)?.value);
    } catch {
      const created = store.createSession();
      owner = created.owner;
      token = created.token;
    }
    const response = json({
      ...store.snapshot(owner),
      identity: store.identity(token || req.cookies.get(SESSION_COOKIE)?.value),
      storage: "sqlite",
      mode: "PAPER",
      providers: {
        gemini: !!process.env.GEMINI_API_KEY,
        sarvam: !!process.env.SARVAM_API_KEY,
      },
    });
    if (token)
      response.cookies.set(SESSION_COOKIE, token, {
        httpOnly: true,
        sameSite: "strict",
        secure: new URL(req.url).protocol === "https:",
        path: "/",
        maxAge: 30 * 86400,
      });
    return response;
  } catch (e) {
    return errorResponse(e);
  }
}
