import { NextRequest } from "next/server";
import { assets, type Symbol } from "@/lib/market";
import { frames, type Frame } from "@/lib/market-data";
import { marketFeed } from "@/lib/server/market-feed";
import { json, errorResponse } from "@/lib/server/http";
export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  try {
    const symbol = req.nextUrl.searchParams.get("symbol"),
      frame = req.nextUrl.searchParams.get("frame") || "24H",
      mode = req.nextUrl.searchParams.get("mode") || "live";
    if (
      !["live", "sample"].includes(mode) ||
      !frames.includes(frame as Frame) ||
      (symbol && !assets.some((a) => a.symbol === symbol))
    )
      return json({ error: "Invalid market parameters." }, 400);
    const feed = marketFeed();
    if (symbol) {
      const [quote, chart] = await Promise.all([
        feed.quote(symbol as Symbol, mode as "live" | "sample"),
        feed.chart(symbol as Symbol, frame as Frame, mode as "live" | "sample"),
      ]);
      return json({ quote, chart });
    }
    return json({
      quotes: await Promise.all(
        assets.map((a) => feed.quote(a.symbol, mode as "live" | "sample")),
      ),
      refreshedAt: new Date().toISOString(),
    });
  } catch (e) {
    return errorResponse(e);
  }
}
