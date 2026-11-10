import { getStore } from "@/lib/server/store";
import { json, errorResponse } from "@/lib/server/http";
export const runtime = "nodejs";
export async function GET() {
  try {
    getStore().db.prepare("SELECT 1").get();
    return json({
      status: "ok",
      database: "sqlite",
      trading: "paper",
      marketData: "coinbase-crypto-polling-and-sample-equities",
      providers: {
        gemini: !!process.env.GEMINI_API_KEY,
        sarvam: !!process.env.SARVAM_API_KEY,
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
