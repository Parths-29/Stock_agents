import { assets, history, type Symbol } from "./market";
export const frames = ["1H", "24H", "7D", "30D", "90D"] as const;
export type Frame = (typeof frames)[number];
export type Quote = {
  symbol: Symbol;
  price: number | null;
  change: number | null;
  source: "Coinbase Exchange" | "sample";
  status: "live" | "stale" | "sample" | "unavailable";
  asOf: string | null;
  receivedAt: string | null;
};
export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};
export type ChartData = {
  symbol: Symbol;
  frame: Frame;
  source: string;
  status: Quote["status"];
  candles: Candle[];
  asOf: string | null;
  notice?: string;
};
export function sampleQuote(symbol: Symbol): Quote {
  const a = assets.find((a) => a.symbol === symbol)!;
  return {
    symbol,
    price: a.price,
    change: a.change,
    source: "sample",
    status: "sample",
    asOf: null,
    receivedAt: null,
  };
}
export function sampleChart(symbol: Symbol, frame: Frame): ChartData {
  const a = assets.find((a) => a.symbol === symbol)!,
    step = { "1H": 60, "24H": 1200, "7D": 8400, "30D": 36000, "90D": 108000 }[
      frame
    ],
    end = Math.floor(Date.now() / 1000);
  return {
    symbol,
    frame,
    source: "sample",
    status: "sample",
    asOf: null,
    candles: history(a.price, frames.indexOf(frame) * 2).map(
      (close, i, points) => ({
        time: end - (71 - i) * step,
        open: points[Math.max(0, i - 1)],
        close,
        high: close * 1.002,
        low: close * 0.998,
        volume: 10 + Math.abs(Math.sin(i * 1.4)) * 20,
      }),
    ),
  };
}
export function quoteFresh(quote: Quote, now = Date.now()) {
  return (
    quote.status === "live" &&
    quote.price !== null &&
    quote.asOf !== null &&
    now - Date.parse(quote.asOf) < 120000 &&
    Date.parse(quote.asOf) <= now + 30000
  );
}
