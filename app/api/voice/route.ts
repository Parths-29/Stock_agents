import { NextRequest, NextResponse } from "next/server";
import {
  assertOrigin,
  session,
  body as readBody,
  errorResponse,
} from "@/lib/server/http";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  try {
    assertOrigin(req);
    session(req, "voice", 6);
    if (!process.env.SARVAM_API_KEY)
      return NextResponse.json(
        { error: "Set SARVAM_API_KEY in .env.local to enable voice." },
        { status: 503 },
      );
    const body = await readBody(req);
    if (
      typeof body.text !== "string" ||
      body.text.length < 1 ||
      body.text.length > 2500 ||
      !["en-IN", "hi-IN"].includes(body.language)
    )
      return NextResponse.json(
        { error: "Invalid text or language." },
        { status: 400 },
      );
    const response = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      signal: AbortSignal.timeout(20000),
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": process.env.SARVAM_API_KEY,
      },
      body: JSON.stringify({
        text: body.text,
        language_code: body.language,
        model: "bulbul:v3",
      }),
    });
    if (!response.ok)
      return NextResponse.json(
        { error: "Voice provider unavailable." },
        { status: 502 },
      );
    const data = await response.json();
    return NextResponse.json({ audio: data.audios?.[0] });
  } catch (e) {
    return errorResponse(e);
  }
}
