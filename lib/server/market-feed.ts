import { assets, type Symbol } from "../market";
import {
  type Candle,
  type ChartData,
  type Frame,
  type Quote,
  quoteFresh,
  sampleChart,
  sampleQuote,
} from "../market-data";
import { ServiceError } from "./store";
type CacheEntry = {
  value: unknown;
  expires: number;
  pending?: Promise<unknown>;
};
export function parseQuote(
  symbol: Symbol,
  ticker: Record<string, unknown>,
  stats: Record<string, unknown>,
  now = Date.now(),
): Quote {
  const price = Number(ticker.price),
    open = Number(stats.open),
    asOf = typeof ticker.time === "string" ? ticker.time : "";
  if (
    !Number.isFinite(price) ||
    price <= 0 ||
    !Number.isFinite(open) ||
    open <= 0 ||
    !Number.isFinite(Date.parse(asOf)) ||
    Date.parse(asOf) > now + 30000
  )
    throw new Error("Invalid market quote.");
  return {
    symbol,
    price,
    change: Math.round((price / open - 1) * 10000) / 100,
    source: "Coinbase Exchange",
    status: now - Date.parse(asOf) < 120000 ? "live" : "stale",
    asOf,
    receivedAt: new Date(now).toISOString(),
  };
}
export function parseCandles(input: unknown): Candle[] {
  if (!Array.isArray(input)) throw new Error("Invalid candle response.");
  const unique = new Map<number, Candle>();
  for (const row of input) {
    if (
      !Array.isArray(row) ||
      row.length < 6 ||
      row.slice(0, 6).some((v) => typeof v !== "number" || !Number.isFinite(v))
    )
      throw new Error("Invalid OHLCV values.");
    const [time, low, high, open, close, volume] = row;
    if (
      time <= 0 ||
      low <= 0 ||
      high < Math.max(open, close, low) ||
      low > Math.min(open, close) ||
      volume < 0
    )
      throw new Error("Invalid OHLCV range.");
    unique.set(time, { time, low, high, open, close, volume });
  }
  const candles = [...unique.values()].sort((a, b) => a.time - b.time);
  if (candles.length < 2) throw new Error("Insufficient market history.");
  return candles;
}
export class MarketFeed {
  private cache = new Map<string, CacheEntry>();
  constructor(
    private fetcher: typeof fetch = fetch,
    private clock: () => number = Date.now,
  ) {}
  private async cached<T>(
    key: string,
    ttl: number,
    load: () => Promise<T>,
  ): Promise<T> {
    const current = this.cache.get(key);
    if (current && current.expires > this.clock()) return current.value as T;
    if (current?.pending) return current.pending as Promise<T>;
    const pending = load()
      .then((value) => {
        this.cache.set(key, { value, expires: this.clock() + ttl });
        return value;
      })
      .catch((e) => {
        this.cache.delete(key);
        throw e;
      });
    this.cache.set(key, { value: current?.value, expires: 0, pending });
    return pending;
  }
  private async get(path: string) {
    const response = await this.fetcher(
      `https://api.exchange.coinbase.com/products/${path}`,
      {
        headers: { Accept: "application/json", "User-Agent": "StockPaws/0.2" },
        signal: AbortSignal.timeout(8000),
        cache: "no-store",
      },
    );
    if (!response.ok)
      throw new Error(`Market provider returned ${response.status}`);
    return response.json();
  }
  async quote(
    symbol: Symbol,
    mode: "live" | "sample" = "live",
  ): Promise<Quote> {
    const a = assets.find((a) => a.symbol === symbol);
    if (!a) throw new ServiceError("Unknown asset.");
    if (mode === "sample" || a.kind === "EQUITY") return sampleQuote(symbol);
    const q = await this.cached<Quote>(`quote:${symbol}`, 15000, async () => {
      try {
        const [ticker, stats] = await Promise.all([
          this.get(`${symbol}-USD/ticker`),
          this.get(`${symbol}-USD/stats`),
        ]);
        return parseQuote(symbol, ticker, stats, this.clock());
      } catch {
        return {
          symbol,
          price: null,
          change: null,
          source: "Coinbase Exchange",
          status: "unavailable",
          asOf: null,
          receivedAt: new Date(this.clock()).toISOString(),
        };
      }
    });
    return q.status === "live" && !quoteFresh(q, this.clock())
      ? { ...q, status: "stale" }
      : q;
  }
  async chart(
    symbol: Symbol,
    frame: Frame,
    mode: "live" | "sample" = "live",
  ): Promise<ChartData> {
    const a = assets.find((a) => a.symbol === symbol);
    if (!a) throw new ServiceError("Unknown asset.");
    if (mode === "sample" || a.kind === "EQUITY")
      return sampleChart(symbol, frame);
    return this.cached<ChartData>(
      `chart:${symbol}:${frame}`,
      20000,
      async () => {
        try {
          const spec = {
              "1H": { step: 60, days: 1 / 24 },
              "24H": { step: 900, days: 1 },
              "7D": { step: 3600, days: 7 },
              "30D": { step: 21600, days: 30 },
              "90D": { step: 86400, days: 90 },
            }[frame],
            now = this.clock();
          const start = new Date(now - spec.days * 86400000).toISOString(),
            end = new Date(now).toISOString();
          const candles = parseCandles(
            await this.get(
              `${symbol}-USD/candles?granularity=${spec.step}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
            ),
          ).filter(
            (c) =>
              c.time * 1000 >= now - spec.days * 86400000 &&
              c.time * 1000 <= now,
          );
          if (candles.length < 2) throw new Error("Insufficient history.");
          const asOf = new Date(
            candles[candles.length - 1].time * 1000,
          ).toISOString();
          return {
            symbol,
            frame,
            source: "Coinbase Exchange",
            status:
              now - Date.parse(asOf) > (spec.step + 120) * 1000
                ? "stale"
                : "live",
            candles,
            asOf,
          };
        } catch {
          return {
            symbol,
            frame,
            source: "Coinbase Exchange",
            status: "unavailable",
            candles: [],
            asOf: null,
            notice:
              "Market history is unavailable. Retry shortly or choose sample mode.",
          };
        }
      },
    );
  }
}
const globals = globalThis as typeof globalThis & {
  stockpawsFeed?: MarketFeed;
};
export const marketFeed = () => (globals.stockpawsFeed ??= new MarketFeed());
