"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowDownUp,
  ArrowUpRight,
  Check,
  ChevronDown,
  ExternalLink,
  PawPrint,
  Plus,
  Radio,
  ShieldCheck,
  Volume2,
  Wallet,
  X,
} from "lucide-react";
import {
  analyze,
  assets as sampleAssets,
  initialPortfolio,
  money,
  pets,
  protection,
  type PetId,
  type Portfolio,
  type Symbol,
} from "@/lib/market";
import TerminalChart from "./TerminalChart";
import PetAvatar from "./PetAvatar";
import MovablePetEngine from "./MovablePetEngine";
import {
  sampleQuote,
  sampleChart,
  quoteFresh,
  type Quote,
  type ChartData,
  type Frame,
} from "@/lib/market-data";
import { captureChart } from "@/lib/chart-capture";
type Journal = { id: string; text: string; time: string };
const assetKind = (symbol: Symbol) =>
  sampleAssets.find((a) => a.symbol === symbol)!.kind;
type PetMemory = {
  petId: string;
  energy: number;
  activity: string;
  updatedAt: string;
};
async function api(path: string, data?: unknown) {
  const response = await fetch(path, {
    method: data ? "POST" : "GET",
    headers: data ? { "Content-Type": "application/json" } : undefined,
    body: data ? JSON.stringify(data) : undefined,
    cache: "no-store",
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Backend request failed.");
  return result;
}
type Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, fn: (accounts: string[]) => void) => void;
  removeListener?: (event: string, fn: (accounts: string[]) => void) => void;
};
export default function Terminal() {
  const [symbol, setSymbol] = useState<Symbol>("ETH"),
    [active, setActive] = useState<PetId>("mochi"),
    [side, setSide] = useState<"BUY" | "SELL">("BUY"),
    [type, setType] = useState("MARKET"),
    [amount, setAmount] = useState("1000"),
    [target, setTarget] = useState(""),
    [wallet, setWallet] = useState(""),
    [marketMode, setMarketMode] = useState<"live" | "sample">("live"),
    [quotes, setQuotes] = useState<Quote[]>([]),
    [chart, setChart] = useState<ChartData | null>(null),
    [frame, setFrame] = useState<Frame>("24H"),
    [authenticated, setAuthenticated] = useState(false),
    [telemetry, setTelemetry] = useState<{
      provider: string;
      model: string | null;
      applicationRequestId: string;
      attestation: string;
      imageAnalyzed: boolean;
      marketSource: string;
      marketAsOf: string | null;
    } | null>(null),
    [notice, setNotice] = useState(""),
    [portfolio, setPortfolio] = useState<Portfolio>(initialPortfolio),
    [journal, setJournal] = useState<Journal[]>([]),
    [ready, setReady] = useState(false),
    [saving, setSaving] = useState(false),
    [petMemory, setPetMemory] = useState<PetMemory[]>([]),
    [review, setReview] = useState(false),
    [prompt, setPrompt] = useState(""),
    [busy, setBusy] = useState(false),
    [voiceBusy, setVoiceBusy] = useState(false),
    [language, setLanguage] = useState("en-IN"),
    [analysis, setAnalysis] = useState(analyze("mochi", "ETH")),
    [source, setSource] = useState("rules"),
    [note, setNote] = useState(""),
    [tab, setTab] = useState("HOLDINGS");
  const requestId = useRef(""),
    reviewPrice = useRef(0),
    analysisVersion = useRef(0),
    submitting = useRef(false);
  const dialogRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!review) return;
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting.current) {
        setReview(false);
        return;
      }
      if (e.key !== "Tab") return;
      const elements = dialogRef.current?.querySelectorAll<HTMLElement>(
        "button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled)",
      );
      if (!elements?.length) {
        e.preventDefault();
        return;
      }
      const first = elements[0],
        last = elements[elements.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [review]);
  const assets = sampleAssets.map((a) => {
    const q =
      marketMode === "sample" || a.kind === "EQUITY"
        ? sampleQuote(a.symbol)
        : quotes.find(
            (q) => q.symbol === a.symbol && q.source === "Coinbase Exchange",
          );
    return {
      ...a,
      price: q?.price ?? a.price,
      change: q?.change ?? a.change,
      status: q?.status || "unavailable",
    };
  });
  const quote: Quote =
    marketMode === "sample" ||
    sampleAssets.find((a) => a.symbol === symbol)!.kind === "EQUITY"
      ? sampleQuote(symbol)
      : quotes.find(
          (q) => q.symbol === symbol && q.source === "Coinbase Exchange",
        ) || {
          symbol,
          price: null,
          change: null,
          source: "Coinbase Exchange",
          status: "unavailable",
          asOf: null,
          receivedAt: null,
        };
  const quoteReady =
    marketMode === "sample" ||
    assetKind(symbol) === "EQUITY" ||
    quoteFresh(quote);
  const valuationReady = portfolio.holdings.every(
    (h) =>
      sampleAssets.find((a) => a.symbol === h.symbol)!.kind === "EQUITY" ||
      marketMode === "sample" ||
      quotes.some((q) => q.symbol === h.symbol && quoteFresh(q)),
  );
  const asset = assets.find((a) => a.symbol === symbol)!,
    pet = pets.find((p) => p.id === active)!,
    risk = protection(asset.price),
    dollars = Number(amount);
  const value =
    portfolio.cash +
    portfolio.holdings.reduce(
      (sum, h) =>
        sum + h.quantity * assets.find((a) => a.symbol === h.symbol)!.price,
      0,
    );
  const available =
    side === "BUY"
      ? portfolio.cash
      : (portfolio.holdings.find((h) => h.symbol === symbol)?.quantity ?? 0) *
        asset.price;
  useEffect(() => {
    let mounted = true;
    let running = false;
    async function refresh() {
      if (running) return;
      running = true;
      try {
        const data = await api(`/api/market?mode=${marketMode}`);
        if (mounted) setQuotes(data.quotes);
      } catch {
        if (mounted) setQuotes([]);
      } finally {
        running = false;
      }
    }
    void refresh();
    const timer = setInterval(refresh, 15000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [marketMode]);
  useEffect(() => {
    let mounted = true;
    setChart(
      marketMode === "sample" || asset.kind === "EQUITY"
        ? sampleChart(symbol, frame)
        : null,
    );
    async function refresh() {
      try {
        const data = await api(
          `/api/market?symbol=${symbol}&frame=${frame}&mode=${marketMode}`,
        );
        if (mounted) {
          setChart(data.chart);
          setQuotes((old) => [
            ...old.filter((q) => q.symbol !== symbol),
            data.quote,
          ]);
        }
      } catch {
        if (mounted)
          setChart({
            symbol,
            frame,
            source: "Coinbase Exchange",
            status: "unavailable",
            candles: [],
            asOf: null,
            notice: "Market data request failed. Retry shortly.",
          });
      }
    }
    void refresh();
    const timer = setInterval(refresh, 20000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [symbol, frame, marketMode]);
  useEffect(() => {
    let mounted = true;
    api("/api/session")
      .then((d) => {
        if (mounted) {
          const identity = d.identity || {
            authenticated: false,
            address: null,
          };
          if (
            !identity.authenticated &&
            new URLSearchParams(window.location.search).get("demo") !== "1"
          ) {
            window.location.replace("/login");
            return;
          }
          setAuthenticated(identity.authenticated);
          setWallet(identity.address || "");
          setPortfolio(d.portfolio);
          setJournal(d.journal);
          setPetMemory(d.petStates);
          const query = new URLSearchParams(window.location.search).get("pet");
          if (!query && d.petStates.length) {
            const latest = [...d.petStates].sort((a: PetMemory, b: PetMemory) =>
              b.updatedAt.localeCompare(a.updatedAt),
            )[0];
            if (pets.some((p) => p.id === latest.petId))
              setActive(latest.petId);
          }
          setReady(true);
        }
      })
      .catch((e) => {
        if (mounted) setNotice(e.message);
      });
    const selected = new URLSearchParams(window.location.search).get("pet");
    if (pets.some((p) => p.id === selected)) setActive(selected as PetId);
    return () => {
      mounted = false;
    };
  }, []);
  useEffect(() => {
    if (ready)
      api("/api/memory", { kind: "pet", petId: active })
        .then((d) => setPetMemory(d.petStates))
        .catch((e) => setNotice(e.message));
  }, [active, ready]);
  useEffect(() => {
    analysisVersion.current++;
    setSource("rules");
    setTelemetry(null);
  }, [active, symbol, dollars, frame, marketMode]);
  useEffect(() => {
    if (telemetry || source === "gemini") return;
    const context =
      marketMode === "live" &&
      asset.kind === "CRYPTO" &&
      quoteFresh(quote) &&
      chart?.status === "live"
        ? {
            price: quote.price!,
            change: quote.change!,
            points: chart.candles.flatMap((c) => [c.low, c.high]),
            source: quote.source,
            asOf: quote.asOf,
          }
        : undefined;
    const next = analyze(
      active,
      symbol,
      Number.isFinite(dollars) && dollars > 0 ? dollars : 1000,
      context,
    );
    setAnalysis(
      marketMode === "live" && asset.kind === "CRYPTO" && !context
        ? {
            ...next,
            analysis:
              "Waiting for fresh crypto context. No current-market analysis is available. Choose sample mode to explore the demo.",
          }
        : next,
    );
  }, [active, symbol, dollars, quotes, chart, marketMode, telemetry, source]);
  useEffect(() => {
    const provider = (window as Window & { ethereum?: Provider }).ethereum;
    const changed = (accounts: string[]) => {
      if (authenticated && accounts[0]?.toLowerCase() !== wallet.toLowerCase())
        setNotice(
          "Wallet account changed. Your session remains bound to the signed-in wallet. Sign out to switch accounts.",
        );
    };
    provider?.on?.("accountsChanged", changed);
    return () => provider?.removeListener?.("accountsChanged", changed);
  }, [authenticated, wallet]);
  async function addJournal(text: string) {
    try {
      const d = await api("/api/memory", { kind: "note", text });
      setJournal(d.journal);
      setNote("");
      setNotice("Journal note saved to the database.");
    } catch (e) {
      setNotice((e as Error).message);
    }
  }
  async function connect() {
    try {
      if (authenticated) await api("/api/auth/logout", {});
      window.location.assign("/login");
    } catch (e) {
      setNotice((e as Error).message);
    }
  }
  async function ask() {
    const version = analysisVersion.current;
    setBusy(true);
    try {
      const chartImage = active === "boba" ? await captureChart() : undefined;
      const r = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: active,
          ticker: symbol,
          userPrompt: prompt,
          amount: Number.isFinite(dollars) && dollars > 0 ? dollars : 1000,
          chartImage,
          marketMode,
          frame,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      if (version !== analysisVersion.current) return;
      setAnalysis(d);
      setSource(d.source);
      setTelemetry(d.telemetry || null);
      if (d.petStates) setPetMemory(d.petStates);
      if (d.notice) setNotice(d.notice);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Analysis failed.");
    } finally {
      setBusy(false);
    }
  }
  async function speak() {
    setVoiceBusy(true);
    try {
      const r = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: analysis.analysis, language }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      if (!d.audio) throw new Error("Voice provider returned no audio.");
      await new Audio(`data:audio/wav;base64,${d.audio}`).play();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Voice playback failed.");
    } finally {
      setVoiceBusy(false);
    }
  }
  function reviewOrder() {
    if (!quoteReady)
      return setNotice("A fresh quote is required. No paper order was placed.");
    if (!ready)
      return setNotice(
        "The backend session is not ready. Reload to reconnect.",
      );
    if (!Number.isFinite(dollars) || dollars <= 0)
      return setNotice("Enter an amount greater than zero.");
    if (dollars > available + 1e-8)
      return setNotice("Order exceeds your available paper balance.");
    if (
      type !== "MARKET" &&
      (!Number.isFinite(Number(target)) || Number(target) <= 0)
    )
      return setNotice("Enter a positive reference price for this draft.");
    requestId.current = crypto.randomUUID();
    reviewPrice.current = asset.price;
    setReview(true);
  }
  async function confirm() {
    if (submitting.current) return;
    submitting.current = true;
    setSaving(true);
    try {
      const d = await api("/api/trade", {
        symbol,
        side,
        amount: dollars,
        type,
        target: type === "MARKET" ? undefined : Number(target),
        requestId: requestId.current,
        marketMode,
        expectedPrice: marketMode === "live" ? reviewPrice.current : undefined,
      });
      setPortfolio(d.portfolio);
      setJournal(d.journal);
      setNotice(
        d.order.status === "FILLED"
          ? "Paper fill committed to the database. Portfolio and journal updated."
          : "Strategy draft saved on the server. No order is active.",
      );
      setReview(false);
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }
  return (
    <main>
      <div className="ticker-strip">
        <span className="ticker-label">
          <Radio size={12} /> MARKET TAPE
        </span>
        {assets.map((a) => (
          <button key={a.symbol} onClick={() => setSymbol(a.symbol)}>
            <b>{a.symbol}</b>
            <span>{a.status === "unavailable" ? "—" : money(a.price)}</span>
            <small>{a.status.toUpperCase()}</small>
            <em className={a.change < 0 ? "negative" : "positive"}>
              {a.status === "unavailable"
                ? "—"
                : `${a.change > 0 ? "+" : ""}${a.change.toFixed(2)}%`}
            </em>
          </button>
        ))}
        <span className="sample-badge">
          {marketMode === "live"
            ? "CRYPTO FEED / EQUITIES SAMPLE"
            : "SAMPLE DATA"}
        </span>
      </div>
      <header>
        <a className="brand" href="/" aria-label="StockPaws home">
          <span className="brand-icon">
            <PawPrint size={25} strokeWidth={2.5} />
          </span>
          STOCKPAWS<span className="brand-divider">/</span>
          <small>TRADING TERMINAL</small>
        </a>
        <div className="header-right">
          <span className="mode">
            <i className="dot" /> PAPER MODE
          </span>
          <div
            className="data-controls desktop-data-controls"
            aria-label="Market data mode"
          >
            <button
              className={marketMode === "live" ? "active" : ""}
              onClick={() => setMarketMode("live")}
            >
              LIVE CRYPTO
            </button>
            <button
              className={marketMode === "sample" ? "active" : ""}
              onClick={() => setMarketMode("sample")}
            >
              SAMPLE
            </button>
          </div>
          <a href="/#phases" className="backend-link">
            {ready ? "BACKEND CONNECTED" : "CONNECTING…"}
          </a>
          <button
            className="wallet-button"
            onClick={connect}
            aria-label={
              authenticated
                ? "Sign out of wallet session"
                : "Sign in with wallet"
            }
            title={authenticated ? "Sign out" : "Sign in"}
          >
            <Wallet size={15} />
            {wallet ? `${wallet.slice(0, 6)}…${wallet.slice(-4)}` : "SIGN IN"}
            <ArrowUpRight size={14} />
          </button>
        </div>
      </header>
      <div className="workspace">
        <div className="intro">
          <div>
            <div className="eyebrow">YOUR EDGE HAS PAWS.</div>
            <h1>
              Trading, with company<span>.</span>
            </h1>
            <p>Five curious minds. One clearer view of the market.</p>
          </div>
          <div className="session">
            <span>WORKSPACE / 001</span>
            <b>
              <span className="dot" /> ALL PAWS ON DECK
            </b>
          </div>
        </div>
        <div className={`market-status ${!quoteReady ? "degraded" : ""}`}>
          <div
            className="data-controls mobile-data-controls"
            aria-label="Market data mode on mobile"
          >
            <button
              className={marketMode === "live" ? "active" : ""}
              onClick={() => setMarketMode("live")}
            >
              LIVE CRYPTO
            </button>
            <button
              className={marketMode === "sample" ? "active" : ""}
              onClick={() => setMarketMode("sample")}
            >
              SAMPLE
            </button>
          </div>
          <span className="dot" />
          {quote.status === "sample"
            ? "Sample mode for this asset · illustrative prices and history."
            : quoteReady
              ? `${quote.source} · polled every 15s · last trade ${new Date(quote.asOf!).toLocaleTimeString()} · paper fills only`
              : "Live crypto quote unavailable or stale. Orders are paused; sample mode is available."}
          <span>{authenticated ? "WALLET VERIFIED" : "GUEST DEMO"}</span>
        </div>
        <div className="summary-bar">
          <div>
            <span>PORTFOLIO VALUE</span>
            <strong>
              {valuationReady ? money(value) : "—"}{" "}
              <small>
                {marketMode === "live" ? "MIXED SOURCES / USD" : "SAMPLE / USD"}
              </small>
            </strong>
          </div>
          <div>
            <span>UNREALIZED P&L</span>
            <strong className="positive">
              {valuationReady
                ? money(
                    portfolio.holdings.reduce(
                      (s, h) =>
                        s +
                        h.quantity *
                          (assets.find((a) => a.symbol === h.symbol)!.price -
                            h.average),
                      0,
                    ),
                  )
                : "—"}
            </strong>
          </div>
          <div>
            <span>AVAILABLE PAPER CASH</span>
            <strong>{money(portfolio.cash)}</strong>
          </div>
          <div className="guardian">
            <ShieldCheck size={25} />
            <div>
              <span>RISK GUARDIAN</span>
              <b>PLAN BEFORE YOU TRADE</b>
              <small>Hoot is on your side.</small>
            </div>
          </div>
        </div>
        <div className="terminal-grid">
          <div className="main-column">
            <div className="market-switch">
              <div className="tabs">
                {assets.map((a) => (
                  <button
                    className={symbol === a.symbol ? "active" : ""}
                    onClick={() => setSymbol(a.symbol)}
                    key={a.symbol}
                  >
                    {a.symbol}
                    <span className={a.change < 0 ? "negative" : "positive"}>
                      {a.status === "unavailable"
                        ? "—"
                        : `${a.change > 0 ? "+" : ""}${a.change}%`}
                    </span>
                  </button>
                ))}
              </div>
              <span className="market-selector">
                USD PAIRS <ChevronDown size={12} />
              </span>
            </div>
            <TerminalChart
              symbol={symbol}
              quote={quote}
              chart={chart}
              frame={frame}
              onFrame={setFrame}
            />
            <MovablePetEngine active={active} onSelect={setActive} />
            <section className="panel vault">
              <div className="panel-title">
                <div className="tabs">
                  <button
                    onClick={() => setTab("HOLDINGS")}
                    className={tab === "HOLDINGS" ? "active" : ""}
                  >
                    PORTFOLIO VAULT <span>{portfolio.holdings.length}</span>
                  </button>
                  <button
                    onClick={() => setTab("JOURNAL")}
                    className={tab === "JOURNAL" ? "active" : ""}
                  >
                    TRADE JOURNAL <span>{journal.length}</span>
                  </button>
                </div>
                <span className="muted">
                  {ready ? "DATABASE SYNCED" : "CONNECTING"}
                </span>
              </div>
              {tab === "HOLDINGS" ? (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>ASSET</th>
                        <th>BALANCE</th>
                        <th>AVG. ENTRY</th>
                        <th>VALUE</th>
                        <th>RETURN</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {portfolio.holdings.map((h) => {
                        const a = assets.find((a) => a.symbol === h.symbol)!;
                        const pnl = (a.price / h.average - 1) * 100;
                        return (
                          <tr key={h.symbol}>
                            <td>
                              <span className="asset-mini">
                                {h.symbol.slice(0, 1)}
                              </span>
                              <b>{h.symbol}</b>
                              <small>{a.name}</small>
                            </td>
                            <td>
                              {h.quantity.toFixed(h.quantity < 1 ? 5 : 2)}
                            </td>
                            <td>{money(h.average)}</td>
                            <td>
                              {a.status === "unavailable"
                                ? "—"
                                : money(h.quantity * a.price)}
                            </td>
                            <td className={pnl < 0 ? "negative" : "positive"}>
                              {a.status === "unavailable"
                                ? "—"
                                : `${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}%`}
                            </td>
                            <td>
                              <button
                                aria-label={`Trade ${h.symbol}`}
                                className="icon-button"
                                onClick={() => {
                                  setSymbol(h.symbol);
                                  setSide("SELL");
                                }}
                              >
                                <ArrowUpRight size={15} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="journal">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (note.trim()) {
                        void addJournal(note.trim());
                      }
                    }}
                  >
                    <input
                      aria-label="Journal note"
                      placeholder="What did you learn today?"
                      maxLength={500}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                    <button
                      className="cream-button"
                      disabled={!note.trim() || !ready}
                    >
                      <Plus size={14} /> SAVE NOTE
                    </button>
                  </form>
                  {journal.length === 0 ? (
                    <p className="muted">
                      Your next trade has a story. Start it here.
                    </p>
                  ) : (
                    journal.map((j) => (
                      <article key={j.id}>
                        <span>{new Date(j.time).toLocaleString()}</span>
                        <p>{j.text}</p>
                      </article>
                    ))
                  )}
                </div>
              )}
            </section>
          </div>
          <aside>
            <section className="panel order-panel">
              <div className="panel-title">
                <span>02 / ORDER TICKET</span>
                <ArrowDownUp size={14} />
              </div>
              <div className="order-body">
                <div className="side-switch">
                  {(["BUY", "SELL"] as const).map((s) => (
                    <button
                      key={s}
                      className={side === s ? "active" : ""}
                      onClick={() => setSide(s)}
                    >
                      {s} {symbol}
                    </button>
                  ))}
                </div>
                <div className="order-types">
                  {["MARKET", "LIMIT", "TWAP", "STOP-LOSS"].map((t) => (
                    <button
                      className={type === t ? "active" : ""}
                      key={t}
                      onClick={() => setType(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <label className="field-label" htmlFor="amount">
                  {side === "BUY" ? "YOU PAY" : "SELL VALUE"}
                  <span>AVAILABLE {money(available)}</span>
                </label>
                <div className="amount-field">
                  <input
                    id="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                  />
                  <span>
                    USD <ChevronDown size={12} />
                  </span>
                </div>
                <div className="percentages">
                  {[25, 50, 75, 100].map((p) => (
                    <button
                      key={p}
                      onClick={() =>
                        setAmount((Math.floor(available * p) / 100).toFixed(2))
                      }
                    >
                      {p}%
                    </button>
                  ))}
                </div>
                {type !== "MARKET" && (
                  <>
                    <label className="field-label" htmlFor="target">
                      REFERENCE PRICE · DRAFT ONLY
                    </label>
                    <input
                      className="target-input"
                      id="target"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                    />
                  </>
                )}
                <div className="order-line">
                  <span>Estimated quantity</span>
                  <b>
                    {quoteReady && Number.isFinite(dollars) && dollars > 0
                      ? (dollars / asset.price).toFixed(6)
                      : "0.000000"}{" "}
                    {symbol}
                  </b>
                </div>
                <div className="order-line">
                  <span>Execution</span>
                  <b>
                    {type === "MARKET"
                      ? "Paper fill · no fees"
                      : "Strategy draft only"}
                  </b>
                </div>
                <div className="risk-box">
                  <ShieldCheck size={18} />
                  <div>
                    <b>HOOT’S RISK REFERENCES</b>
                    <p>
                      −5% stop{" "}
                      <strong>{quoteReady ? money(risk.stop) : "—"}</strong>
                    </p>
                    <p>
                      +10% take{" "}
                      <strong>{quoteReady ? money(risk.take) : "—"}</strong>
                    </p>
                    <small>Calculated levels · protection is not active</small>
                  </div>
                </div>
                <button
                  className="execute-button"
                  onClick={reviewOrder}
                  disabled={!ready || !quoteReady}
                >
                  {type === "MARKET"
                    ? "REVIEW PAPER ORDER"
                    : "REVIEW STRATEGY DRAFT"}
                  <ArrowUpRight size={18} />
                </button>
                <p className="order-caption">
                  {type === "MARKET"
                    ? "Practice with virtual funds. No wallet signature."
                    : "Drafts are saved, never scheduled or executed."}
                </p>
              </div>
            </section>
            <section className="panel agent-panel">
              <div className="panel-title">
                <span>03 / YOUR CO-PILOTS</span>
                <span className="muted">05 ONLINE</span>
              </div>
              <div className="agent-select">
                {pets.map((p) => (
                  <button
                    title={p.role}
                    aria-label={`Ask ${p.name}`}
                    aria-pressed={p.id === active}
                    key={p.id}
                    className={active === p.id ? "active" : ""}
                    onClick={() => setActive(p.id)}
                  >
                    <PetAvatar id={p.id} size={44} />
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>
              <div className="agent-detail">
                <div className="agent-heading">
                  <div>
                    <b>
                      {pet.name}
                      <span className="dot" />
                    </b>
                    <span>{pet.role.toUpperCase()}</span>
                  </div>
                  <span className="source-tag">
                    {source === "gemini" ? "GEMINI" : "RULES ENGINE"}
                  </span>
                </div>
                <p className="analysis">{analysis.analysis}</p>
                {telemetry && (
                  <div className="provider-telemetry">
                    <b>
                      {telemetry.provider.toUpperCase()}{" "}
                      {telemetry.model || "DETERMINISTIC CALCULATIONS"}
                    </b>
                    <br />
                    {telemetry.imageAnalyzed
                      ? "PNG chart analyzed"
                      : "No vision inference performed"}{" "}
                    · TEE: {telemetry.attestation}
                    <br />
                    Request: {telemetry.applicationRequestId}
                    <br />
                    Market: {telemetry.marketSource}{" "}
                    {telemetry.marketAsOf || "sample"}
                  </div>
                )}
                <div className="pet-memory">
                  <span>
                    ENERGY{" "}
                    {petMemory.find((p) => p.petId === active)?.energy ?? 100}%
                  </span>
                  <span>
                    {petMemory.find((p) => p.petId === active)?.activity ??
                      "Ready"}{" "}
                    · SAVED
                  </span>
                </div>
                <div className="voice-row">
                  <button onClick={speak} disabled={voiceBusy || !ready}>
                    <Volume2 size={13} />
                    {voiceBusy ? "SYNTHESIZING…" : "HEAR INSIGHT"}
                  </button>
                  <select
                    aria-label="Voice language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    <option value="en-IN">English</option>
                    <option value="hi-IN">Hindi voice</option>
                  </select>
                </div>
                <form
                  className="prompt"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void ask();
                  }}
                >
                  <input
                    value={prompt}
                    maxLength={2000}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={`Ask ${pet.name} about ${symbol}…`}
                    aria-label="Ask your co-pilot"
                  />
                  <button
                    disabled={busy || !ready || !quoteReady}
                    aria-label="Send question"
                  >
                    {busy ? "…" : <ArrowUpRight size={19} />}
                  </button>
                </form>
                <small className="agent-footnote">
                  {source === "gemini"
                    ? "AI explanation grounded in demo calculations."
                    : "Calculated insights. Add a Gemini key for AI Q&A."}
                </small>
              </div>
            </section>
          </aside>
        </div>
        <footer>
          <span>
            <PawPrint size={13} /> BUILT FOR CURIOUS TRADERS.
          </span>
          <span>
            LABELED DATA SOURCES · PAPER ORDERS · YOUR KEYS STAY YOURS
          </span>
          <button
            onClick={() => {
              setActive("hoot");
              setNotice(
                "Risk is measured in dollars here. A pet score cannot certify that a trade is safe.",
              );
            }}
          >
            A LITTLE LESS CHAOS. A FEW MORE PAWS. <ExternalLink size={11} />
          </button>
        </footer>
      </div>
      {notice && (
        <div className="toast" role="status">
          <span>{notice}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            <X size={17} />
          </button>
        </div>
      )}
      {review && (
        <div className="modal-backdrop">
          <section
            ref={dialogRef}
            className="review-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-title"
          >
            <div className="panel-title">
              <span id="review-title">
                {type === "MARKET"
                  ? "REVIEW PAPER ORDER"
                  : "REVIEW STRATEGY DRAFT"}
              </span>
              <button
                disabled={saving}
                onClick={() => setReview(false)}
                aria-label="Close review"
              >
                <X size={18} />
              </button>
            </div>
            <div className="review-content">
              <PawPrint size={32} />
              <h2>
                {side} {money(dollars)} of {symbol}
              </h2>
              <p>
                {type === "MARKET"
                  ? `Paper fill reference ${money(reviewPrice.current)} (${quote.source}). ${marketMode === "live" && asset.kind === "CRYPTO" ? "Server checks a fresh price within 0.5% of this reference. " : ""}Virtual funds only; fees and slippage are not simulated.`
                  : `${type} reference ${money(Number(target))}. This records your plan. It does not place an order or reserve funds.`}
              </p>
              <button
                autoFocus
                className="execute-button"
                onClick={confirm}
                disabled={saving}
              >
                <Check size={16} />
                {saving
                  ? "SAVING…"
                  : type === "MARKET"
                    ? "CONFIRM PAPER FILL"
                    : "SAVE DRAFT"}
              </button>
              <button
                className="cancel"
                disabled={saving}
                onClick={() => setReview(false)}
              >
                GO BACK
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
