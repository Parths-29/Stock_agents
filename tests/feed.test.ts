import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MarketFeed,
  parseQuote,
  parseCandles,
} from "../lib/server/market-feed";
import { quoteFresh } from "../lib/market-data";
test("quote parser preserves exchange timestamps and marks stale or invalid data", () => {
  const now = Date.now(),
    q = parseQuote(
      "ETH",
      { price: "2000", time: new Date(now).toISOString() },
      { open: "1900" },
      now,
    );
  assert.equal(q.price, 2000);
  assert.equal(q.change, 5.26);
  assert.equal(quoteFresh(q, now), true);
  assert.equal(
    parseQuote(
      "ETH",
      { price: "2000", time: new Date(now - 180000).toISOString() },
      { open: "1900" },
      now,
    ).status,
    "stale",
  );
  assert.throws(() =>
    parseQuote(
      "ETH",
      { price: "NaN", time: new Date(now).toISOString() },
      { open: "1900" },
      now,
    ),
  );
});
test("OHLCV parsing sorts, deduplicates and rejects impossible candles", () => {
  const input = [
    [2, 90, 110, 100, 105, 3],
    [1, 80, 100, 90, 95, 2],
    [2, 90, 110, 100, 105, 3],
  ];
  const candles = parseCandles(input);
  assert.deepEqual(
    candles.map((c) => c.time),
    [1, 2],
  );
  assert.equal(candles[1].volume, 3);
  assert.throws(() =>
    parseCandles([
      [1, 100, 90, 95, 95, 1],
      [2, 90, 100, 95, 95, 1],
    ]),
  );
});
test("feed coalesces provider requests and never returns sample crypto on provider failure", async () => {
  let calls = 0;
  const now = Date.now(),
    fetcher = (async (input) => {
      calls++;
      return Response.json(
        String(input).endsWith("/ticker")
          ? { price: "2100", time: new Date(now).toISOString() }
          : { open: "2000" },
      );
    }) as typeof fetch;
  const feed = new MarketFeed(fetcher, () => now);
  const [a, b] = await Promise.all([feed.quote("ETH"), feed.quote("ETH")]);
  assert.equal(a.price, 2100);
  assert.equal(b.price, 2100);
  assert.equal(calls, 2);
  const broken = new MarketFeed((async () => {
    throw new Error("offline");
  }) as typeof fetch);
  assert.equal((await broken.quote("ETH")).status, "unavailable");
  assert.equal((await broken.quote("ETH")).price, null);
  assert.equal((await broken.quote("NVDA")).status, "sample");
});
