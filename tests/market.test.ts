import { test } from "node:test";
import assert from "node:assert/strict";
import {
  analyze,
  fillOrder,
  initialPortfolio,
  protection,
} from "../lib/market";
test("risk levels use exact -5% / +10% references", () => {
  assert.deepEqual(protection(100), { stop: 95, take: 110.00000000000001 });
  assert.throws(() => protection(0));
});
test("buy and sell preserve cash + marked holdings and do not mutate input", () => {
  const original = structuredClone(initialPortfolio);
  const buy = fillOrder(original, {
    symbol: "ETH",
    side: "BUY",
    amount: 2450.8,
  });
  assert.equal(buy.cash, 22549.2);
  assert.equal(buy.holdings.find((h) => h.symbol === "ETH")!.quantity, 13);
  const sold = fillOrder(buy, { symbol: "ETH", side: "SELL", amount: 2450.8 });
  assert.equal(sold.cash, 25000);
  assert.equal(sold.holdings.find((h) => h.symbol === "ETH")!.quantity, 12);
  assert.deepEqual(original, initialPortfolio);
});
test("invalid orders cannot alter balances", () => {
  for (const amount of [0, -1, NaN, Infinity, 26000])
    assert.throws(() =>
      fillOrder(initialPortfolio, { symbol: "ETH", side: "BUY", amount }),
    );
  assert.throws(() =>
    fillOrder(initialPortfolio, { symbol: "AAPL", side: "SELL", amount: 100 }),
  );
});
test("full sale removes the holding and retained shares preserve average entry", () => {
  const p = {
    cash: 0,
    holdings: [{ symbol: "ETH" as const, quantity: 1, average: 1000 }],
  };
  const partial = fillOrder(p, { symbol: "ETH", side: "SELL", amount: 1225.4 });
  assert.equal(partial.holdings[0].average, 1000);
  assert.equal(partial.holdings[0].quantity, 0.5);
  assert.deepEqual(
    fillOrder(p, { symbol: "ETH", side: "SELL", amount: 2450.8 }).holdings,
    [],
  );
});
test("all agent calculations use the selected asset and order amount", () => {
  const risk = analyze("hoot", "ETH", 2000);
  assert.equal(risk.metrics.positionRisk, 100);
  assert.equal(risk.metrics.stop, 2450.8 * 0.95);
  assert.match(analyze("claude", "ETH", 2000).analysis, /500.00/);
});
