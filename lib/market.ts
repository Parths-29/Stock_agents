export const assets = [
  {
    symbol: "ETH",
    name: "Ethereum",
    price: 2450.8,
    change: 2.84,
    kind: "CRYPTO",
  },
  {
    symbol: "BTC",
    name: "Bitcoin",
    price: 67482.3,
    change: 1.62,
    kind: "CRYPTO",
  },
  {
    symbol: "SOL",
    name: "Solana",
    price: 145.62,
    change: 5.12,
    kind: "CRYPTO",
  },
  {
    symbol: "NVDA",
    name: "NVIDIA",
    price: 880.24,
    change: 4.2,
    kind: "EQUITY",
  },
  { symbol: "AAPL", name: "Apple", price: 182.4, change: -1.1, kind: "EQUITY" },
  {
    symbol: "TSLA",
    name: "Tesla",
    price: 248.5,
    change: -2.34,
    kind: "EQUITY",
  },
] as const;
export type Symbol = (typeof assets)[number]["symbol"];
export const pets = [
  {
    id: "mochi",
    name: "Mochi",
    animal: "CAT",
    role: "Trend coach",
    glyph: "猫",
    color: "#F4F1DE",
    motto: "Making sense of the market.",
  },
  {
    id: "boba",
    name: "Boba",
    animal: "SHIBA",
    role: "Chart scout",
    glyph: "犬",
    color: "#FFB987",
    motto: "Sniffing out the next level.",
  },
  {
    id: "kip",
    name: "Kip",
    animal: "AXOLOTL",
    role: "Quant analyst",
    glyph: "水",
    color: "#C0C7E8",
    motto: "Small positions. Big patience.",
  },
  {
    id: "hoot",
    name: "Hoot",
    animal: "OWL",
    role: "Risk guardian",
    glyph: "守",
    color: "#C5D6AD",
    motto: "Your downside deserves a plan.",
  },
  {
    id: "claude",
    name: "Claude",
    animal: "OCTOPUS",
    role: "Execution planner",
    glyph: "八",
    color: "#FF6F61",
    motto: "One thoughtful slice at a time.",
  },
] as const;
export type PetId = (typeof pets)[number]["id"];
export const money = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
export function history(price: number, seed = 0) {
  return Array.from(
    { length: 72 },
    (_, i) =>
      price *
      (0.966 +
        i * 0.00047 +
        Math.sin(i * 0.59 + seed) * 0.004 +
        Math.cos(i * 1.73) * 0.002),
  );
}
export function protection(price: number) {
  if (!Number.isFinite(price) || price <= 0)
    throw new Error("Price must be positive.");
  return { stop: price * 0.95, take: price * 1.1 };
}
export type Holding = { symbol: Symbol; quantity: number; average: number };
export type Portfolio = { cash: number; holdings: Holding[] };
export const initialPortfolio: Portfolio = {
  cash: 25000,
  holdings: [
    { symbol: "ETH", quantity: 12, average: 2180 },
    { symbol: "BTC", quantity: 0.65, average: 61200 },
    { symbol: "NVDA", quantity: 24, average: 810 },
    { symbol: "SOL", quantity: 95, average: 132 },
  ],
};
export type Order = { symbol: Symbol; side: "BUY" | "SELL"; amount: number };
export function fillOrder(
  portfolio: Portfolio,
  order: Order,
  executionPrice?: number,
): Portfolio {
  const asset = assets.find((a) => a.symbol === order.symbol);
  if (
    !asset ||
    !["BUY", "SELL"].includes(order.side) ||
    !Number.isFinite(order.amount) ||
    order.amount <= 0
  )
    throw new Error("Enter a valid positive order amount.");
  const price = executionPrice ?? asset.price;
  if (!Number.isFinite(price) || price <= 0)
    throw new Error("Invalid execution price.");
  const quantity = order.amount / price,
    previous = portfolio.holdings.find((h) => h.symbol === order.symbol);
  if (order.side === "BUY" && order.amount > portfolio.cash)
    throw new Error("Insufficient paper cash.");
  if (
    order.side === "SELL" &&
    (!previous || quantity > previous.quantity + 1e-10)
  )
    throw new Error("Insufficient holdings.");
  const holdings = portfolio.holdings.filter((h) => h.symbol !== order.symbol);
  const nextQuantity =
    (previous?.quantity ?? 0) + (order.side === "BUY" ? quantity : -quantity);
  if (nextQuantity > 1e-10)
    holdings.push({
      symbol: order.symbol,
      quantity: nextQuantity,
      average:
        order.side === "BUY"
          ? ((previous?.quantity ?? 0) * (previous?.average ?? 0) +
              order.amount) /
            nextQuantity
          : previous!.average,
    });
  return {
    cash:
      portfolio.cash + (order.side === "BUY" ? -order.amount : order.amount),
    holdings,
  };
}
export type AnalysisContext = {
  price: number;
  change: number;
  points: number[];
  source: string;
  asOf: string | null;
};
export function analyze(
  id: PetId,
  symbol: Symbol,
  amount = 1000,
  context?: AnalysisContext,
) {
  const base = assets.find((a) => a.symbol === symbol)!;
  const a = context
    ? { ...base, price: context.price, change: context.change }
    : base;
  const p = protection(a.price);
  const points = context?.points.length ? context.points : history(a.price);
  const support = Math.min(...points),
    resistance = Math.max(...points);
  const insights: Record<PetId, string> = {
    mochi: `${a.name} is ${a.change > 0 ? "up" : "down"} ${Math.abs(a.change)}% ${context ? "over 24 hours on " + context.source : "in this sample session"}. ${context ? "Check your risk budget and the quote timestamp before deciding." : "This is a demo snapshot; compare fresh prices and your risk budget before deciding."}`,
    boba: `The ${context ? "observed" : "sample"} chart spans ${money(support)}–${money(resistance)}. These are observed extremes, not confirmed support or resistance; a genuine breakout needs live volume and follow-through.`,
    kip: `A ${money(amount)} position buys ${(amount / a.price).toFixed(6)} ${symbol}. With a 5% stop, planned price risk is ${money(amount * 0.05)} before fees, gaps and slippage.`,
    hoot: `At ${money(a.price)}, a 5% stop reference is ${money(p.stop)} and a 10% take-profit reference is ${money(p.take)}. That is a 2:1 reward/risk ratio; these levels are calculations, not active orders.`,
    claude: `Split ${money(amount)} into 4 slices of ${money(amount / 4)} at T+0, +15, +30 and +45 minutes. This is a draft TWAP schedule; no background execution is running.`,
  };
  return {
    analysis: insights[id],
    source: "rules" as const,
    action: "REVIEW",
    metrics: {
      stop: p.stop,
      take: p.take,
      positionRisk: amount * 0.05,
      support,
      resistance,
    },
  };
}
