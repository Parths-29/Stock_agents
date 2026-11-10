import { NextRequest } from "next/server";
import {
  session,
  json,
  errorResponse,
  assertOrigin,
  body,
} from "@/lib/server/http";
import { marketFeed } from "@/lib/server/market-feed";
import { quoteFresh } from "@/lib/market-data";
import { assets } from "@/lib/market";
import { ServiceError } from "@/lib/server/store";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  try {
    assertOrigin(req);
    const { store, owner } = session(req, "trade");
    const input = await body(req);
    const replay = store.replay(owner, input);
    if (replay) return json(replay);
    let execution;
    if (
      input.marketMode === "live" &&
      assets.some((a) => a.symbol === input.symbol && a.kind === "CRYPTO")
    ) {
      const quote = await marketFeed().quote(input.symbol);
      if (!quoteFresh(quote))
        throw new ServiceError(
          "Fresh crypto quote unavailable. No paper order was filled.",
          503,
        );
      execution = {
        price: quote.price!,
        source: quote.source,
        asOf: quote.asOf,
      };
    }
    return json(store.trade(owner, input, execution));
  } catch (e) {
    return errorResponse(e);
  }
}
